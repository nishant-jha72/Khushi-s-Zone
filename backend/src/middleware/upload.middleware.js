const multer = require("multer");

// Use memory storage for Buffer uploading to Cloudinary
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo"
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WEBP, GIF, AVIF, MP4, WEBM, MOV.`);
    error.status = 400;
    cb(error, false);
  }
};

const maxFileSizeMB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || "50", 10);

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024, // max limit in bytes
  },
});

module.exports = {
  upload,
};
