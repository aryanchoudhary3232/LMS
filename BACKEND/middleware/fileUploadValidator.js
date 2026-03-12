/**
 * File Upload Validator Middleware
 *
 * Validates uploaded files AFTER multer processes them but BEFORE the controller.
 * Checks:  mime type whitelist, max file size, max file count, required file fields.
 *
 * Also exports an enhanced multer fileFilter and limits config that can be
 * added to the multer instance for early rejection during the upload stream.
 *
 * Usage (post-upload validation):
 *   const { validateFiles, MIME } = require('../middleware/fileUploadValidator');
 *   router.post('/upload', upload.any(), validateFiles({ ... }), controller);
 *
 * Usage (multer-level filter — add to upload.js):
 *   const { multerFileFilter, UPLOAD_LIMITS } = require('../middleware/fileUploadValidator');
 *   const upload = multer({ storage, fileFilter: multerFileFilter, limits: UPLOAD_LIMITS });
 */

// ─────────────────────────────────────────────
// Allowed MIME types grouped by category
// ─────────────────────────────────────────────

const MIME = {
  IMAGE: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  VIDEO: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
  ],
  DOCUMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/rtf",
    "application/zip",
    "application/x-zip-compressed",
  ],
  ALL() {
    return [...this.IMAGE, ...this.VIDEO, ...this.DOCUMENT];
  },
};

// ─────────────────────────────────────────────
// Default size limits (in bytes)
// ─────────────────────────────────────────────

const SIZE = {
  IMAGE: 5 * 1024 * 1024, // 5 MB
  VIDEO: 100 * 1024 * 1024, // 100 MB
  DOCUMENT: 10 * 1024 * 1024, // 10 MB
};

/**
 * Returns the size limit for a given mime type.
 */
function sizeForMime(mime) {
  if (MIME.IMAGE.includes(mime)) return SIZE.IMAGE;
  if (MIME.VIDEO.includes(mime)) return SIZE.VIDEO;
  if (MIME.DOCUMENT.includes(mime)) return SIZE.DOCUMENT;
  return SIZE.IMAGE; // default fallback
}

// ─────────────────────────────────────────────
// Multer-level helpers (early rejection)
// ─────────────────────────────────────────────

/**
 * Generic multer fileFilter — rejects any mime not in the global whitelist.
 * Attach to multer: multer({ storage, fileFilter: multerFileFilter })
 */
function multerFileFilter(req, file, cb) {
  if (MIME.ALL().includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type "${file.mimetype}" is not allowed. Accepted: images, videos, PDFs.`,
      ),
      false,
    );
  }
}

/**
 * Global multer limits object.
 */
const UPLOAD_LIMITS = {
  fileSize: 100 * 1024 * 1024, // 100 MB (absolute max — per-type checks in post-upload)
  files: 20, // max total files per request
};

// ─────────────────────────────────────────────
// Post-upload validation middleware factory
// ─────────────────────────────────────────────

/**
 * Creates an Express middleware that validates already-uploaded files.
 *
 * @param {Object}   config
 * @param {string[]} [config.allowedTypes]    - Whitelist of MIME types (default: all)
 * @param {number}   [config.maxFileSize]     - Max bytes per file (default: auto per type)
 * @param {number}   [config.maxFiles]        - Max number of files (default: 10)
 * @param {string[]} [config.requiredFields]  - Field names that MUST have a file
 * @param {Object}   [config.fieldTypes]      - Map of fieldName → allowed MIME category
 *                                              e.g. { image: 'IMAGE', video: 'VIDEO' }
 * @returns {Function} Express middleware
 */
function validateFiles(config = {}) {
  const {
    allowedTypes = MIME.ALL(),
    maxFileSize, // undefined = use per-type auto limits
    maxFiles = 10,
    requiredFields = [],
    fieldTypes = {}, // e.g. { image: 'IMAGE', video: 'VIDEO', notes: 'DOCUMENT' }
  } = config;

  return (req, res, next) => {
    // Normalize file list (upload.single → req.file, upload.any/fields → req.files)
    const fileArray = req.files
      ? Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat()
      : req.file
        ? [req.file]
        : [];

    //  Check required file fields
    if (requiredFields.length > 0) {
      const uploadedFields = new Set(fileArray.map((f) => f.fieldname));
      const missing = requiredFields.filter((f) => !uploadedFields.has(f));
      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required file(s): ${missing.join(", ")}`,
        });
      }
    }

    //  Check total file count
    if (fileArray.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Too many files uploaded (${fileArray.length}). Maximum allowed: ${maxFiles}`,
      });
    }

    //  Validate each file
    for (const file of fileArray) {
      // — Field-specific type check (e.g. "image" field must be IMAGE mime)
      const expectedCategory = fieldTypes[file.fieldname];
      if (expectedCategory && MIME[expectedCategory]) {
        if (!MIME[expectedCategory].includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `Invalid file type for "${file.fieldname}". Expected ${expectedCategory.toLowerCase()} but got "${file.mimetype}"`,
          });
        }
      } else {
        // — General whitelist check
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `File type "${file.mimetype}" is not allowed for "${file.fieldname}". Allowed: ${allowedTypes.join(", ")}`,
          });
        }
      }

      // — Size check (use explicit limit, or auto-detect per mime type)
      const limit = maxFileSize || sizeForMime(file.mimetype);
      if (file.size && file.size > limit) {
        const limitMB = (limit / (1024 * 1024)).toFixed(1);
        return res.status(400).json({
          success: false,
          message: `File "${file.originalname}" (${file.fieldname}) exceeds the ${limitMB} MB size limit`,
        });
      }
    }

    next();
  };
}

// ─────────────────────────────────────────────
// Pre-built file-validation configs for LMS routes
// ─────────────────────────────────────────────

const fileConfigs = {
  /** POST /teacher/courses/create_course */
  createCourse: {
    requiredFields: ["image", "video"],
    maxFiles: 20,
    fieldTypes: {
      image: "IMAGE",
      video: "VIDEO",
      notes: "DOCUMENT",
    },
  },

  /** PUT /teacher/courses/:courseId */
  updateCourse: {
    maxFiles: 20,
    fieldTypes: {
      image: "IMAGE",
      video: "VIDEO",
      notes: "DOCUMENT",
    },
  },

  /** POST /teacher/verification/upload */
  qualificationUpload: {
    requiredFields: ["qualification"],
    maxFiles: 1,
    allowedTypes: [...MIME.IMAGE, ...MIME.DOCUMENT],
    maxFileSize: 10 * 1024 * 1024, // 10 MB
  },

  /** POST /assignments/teacher/create */
  teacherCreateAssignment: {
    maxFiles: 5,
    allowedTypes: [...MIME.IMAGE, ...MIME.DOCUMENT],
    maxFileSize: 20 * 1024 * 1024, // 20 MB
  },

  /** POST /assignments/student/submit/:assignmentId */
  studentSubmitAssignment: {
    maxFiles: 3,
    allowedTypes: [...MIME.IMAGE, ...MIME.DOCUMENT],
    maxFileSize: 20 * 1024 * 1024, // 20 MB
  },
};

module.exports = {
  validateFiles,
  fileConfigs,
  multerFileFilter,
  UPLOAD_LIMITS,
  MIME,
  SIZE,
};
