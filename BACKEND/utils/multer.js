const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

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

const upload = multer({ storage });

module.exports = {upload}