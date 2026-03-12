const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { multerFileFilter, UPLOAD_LIMITS } = require("./fileUploadValidator");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    // choose resource type based on mimetype; allow pdf as raw
    let resourceType = "image";
    if (file.mimetype.startsWith("video")) {
      resourceType = "video";
    } else if (file.mimetype === "application/pdf") {
      resourceType = "raw"; // store PDFs as raw in cloudinary
    }

    return {
      folder: `uploads`,
      resource_type: resourceType,
    };
  },
});

const upload = multer({
  storage,
  fileFilter: multerFileFilter, // reject disallowed mime types immediately
  limits: UPLOAD_LIMITS, // enforce max file size & count at stream level
});

module.exports = { upload, cloudinary };
