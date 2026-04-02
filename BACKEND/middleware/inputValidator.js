/**
 * Input Validator Middleware
 *
 * Lightweight schema-based request body validation.
 * Validates field types, required fields, lengths, ranges, patterns, and enums
 * BEFORE the request reaches the controller — providing clear error messages.
 *
 * Usage:
 *   const { validate, schemas } = require('../middleware/inputValidator');
 *   router.post('/courses', validate(schemas.createCourse), controller);
 */

// ─────────────────────────────────────────────
// Core validation engine
// ─────────────────────────────────────────────

/**
 * Validates a single field value against its rule set.
 * @returns {string|null} Error message or null if valid
 */
function validateField(field, value, rules) {
  // Required check
  if (
    rules.required &&
    (value === undefined || value === null || value === "")
  ) {
    return `${field} is required`;
  }

  // Skip further checks if value is absent and not required
  if (value === undefined || value === null || value === "") return null;

  switch (rules.type) {
    case "string": {
      if (typeof value !== "string") return `${field} must be a string`;
      if (rules.minLength && value.trim().length < rules.minLength)
        return `${field} must be at least ${rules.minLength} characters`;
      if (rules.maxLength && value.trim().length > rules.maxLength)
        return `${field} must be at most ${rules.maxLength} characters`;
      if (rules.pattern && !rules.pattern.test(value))
        return rules.patternMsg || `${field} format is invalid`;
      break;
    }

    case "number": {
      const num = Number(value);
      if (isNaN(num)) return `${field} must be a valid number`;
      if (rules.min !== undefined && num < rules.min)
        return `${field} must be at least ${rules.min}`;
      if (rules.max !== undefined && num > rules.max)
        return `${field} must be at most ${rules.max}`;
      if (rules.integer && !Number.isInteger(num))
        return `${field} must be a whole number`;
      break;
    }

    case "email": {
      if (
        typeof value !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      )
        return `${field} must be a valid email address`;
      break;
    }

    case "array": {
      // Accept JSON string arrays too (from form-data)
      let arr = value;
      if (typeof value === "string") {
        try {
          arr = JSON.parse(value);
        } catch {
          return `${field} must be a valid array`;
        }
      }
      if (!Array.isArray(arr)) return `${field} must be an array`;
      if (rules.minItems !== undefined && arr.length < rules.minItems)
        return `${field} must have at least ${rules.minItems} items`;
      if (rules.maxItems !== undefined && arr.length > rules.maxItems)
        return `${field} must have at most ${rules.maxItems} items`;
      break;
    }

    case "enum": {
      if (!rules.values.includes(value))
        return `${field} must be one of: ${rules.values.join(", ")}`;
      break;
    }

    case "objectId": {
      if (typeof value !== "string" || !/^[a-fA-F0-9]{24}$/.test(value))
        return `${field} must be a valid ID`;
      break;
    }

    case "jsonString": {
      if (typeof value !== "string") return `${field} must be a JSON string`;
      try {
        JSON.parse(value);
      } catch {
        return `${field} must be valid JSON`;
      }
      break;
    }

    case "boolean": {
      if (typeof value !== "boolean" && value !== "true" && value !== "false")
        return `${field} must be true or false`;
      break;
    }
  }

  return null;
}

/**
 * Express middleware factory — validates req.body against a schema.
 *
 * @param {Object} schema - An object where keys are field names and values are rule objects.
 * @param {Object} [options]
 * @param {boolean} [options.allowUnknown=true] - Whether to allow fields not in the schema.
 * @param {string}  [options.source='body']     - Which req property to validate ('body' | 'query').
 * @returns {Function} Express middleware
 */
function validate(schema, options = {}) {
  const { allowUnknown = true, source = "body" } = options;

  return (req, res, next) => {
    const data = req[source] || {};
    const errors = [];

    // Validate each field defined in the schema
    for (const [field, rules] of Object.entries(schema)) {
      const error = validateField(field, data[field], rules);
      if (error) errors.push(error);
    }

    // Optionally reject unknown fields
    if (!allowUnknown) {
      const allowed = new Set(Object.keys(schema));
      for (const key of Object.keys(data)) {
        if (!allowed.has(key)) {
          errors.push(`Unknown field: ${key}`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
}

// ─────────────────────────────────────────────
// Pre-built schemas for LMS routes
// ─────────────────────────────────────────────

const schemas = {
  // ── Teacher ──────────────────────────────────

  createCourse: {
    title: { type: "string", required: true, minLength: 3, maxLength: 200 },
    description: {
      type: "string",
      required: true,
      minLength: 10,
      maxLength: 5000,
    },
    category: { type: "string", required: true, maxLength: 100 },
    level: {
      type: "enum",
      required: true,
      values: ["Beginner", "Intermediate", "Advanced"],
    },
    duration: { type: "string", required: true, maxLength: 50 },
    price: { type: "number", required: true, min: 0, max: 999999 },
    chapters: { type: "jsonString", required: true },
  },

  updateCourse: {
    title: { type: "string", minLength: 3, maxLength: 200 },
    description: { type: "string", minLength: 10, maxLength: 5000 },
    category: { type: "string", maxLength: 100 },
    level: { type: "enum", values: ["Beginner", "Intermediate", "Advanced"] },
    duration: { type: "string", maxLength: 50 },
    price: { type: "number", min: 0, max: 999999 },
    chapters: { type: "jsonString" },
  },

  teacherVerification: {
    degree: { type: "string", required: true, minLength: 2, maxLength: 120 },
    institution: {
      type: "string",
      required: true,
      minLength: 2,
      maxLength: 200,
    },
    specialization: { type: "string", maxLength: 120 },
    experienceYears: {
      type: "number",
      required: true,
      min: 0,
      max: 60,
      integer: true,
    },
    bio: { type: "string", maxLength: 1000 },
  },

  // ── Student ──────────────────────────────────

  quizSubmit: {
    courseId: { type: "objectId", required: true },
    chapterId: { type: "objectId", required: true },
    topicId: { type: "objectId", required: true },
    answerQuiz: { type: "array", required: true, minItems: 1 },
  },

  updateEnrollCourses: {
    courseIds: { type: "array", required: true, minItems: 1 },
  },

  studentProgress: {
    minutes: {
      type: "number",
      required: true,
      min: 1,
      max: 1440,
      integer: true,
    },
  },

  markTopicComplete: {
    courseId: { type: "objectId", required: true },
    chapterId: { type: "objectId", required: true },
    topicId: { type: "objectId", required: true },
  },

  // ── Admin ────────────────────────────────────

  approveRejectTeacher: {
    notes: { type: "string", maxLength: 1000 },
  },
};

module.exports = { validate, schemas };
