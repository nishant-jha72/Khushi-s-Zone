const express = require("express");
const { upload } = require("../middleware/upload.middleware");
const { authenticateToken } = require("../middleware/authMiddleware");
const productMediaController = require("../controllers/productMedia.controller");

const router = express.Router({ mergeParams: true });

// Error handling wrapper for Multer file upload errors
function handleUploadMiddleware(req, res, next) {
  upload.array("media", 10)(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        const maxMB = process.env.MAX_UPLOAD_SIZE_MB || "50";
        return res.status(400).json({ success: false, message: `File size limit exceeded (Max ${maxMB}MB)` });
      }
      return res.status(400).json({ success: false, message: err.message || "File upload error" });
    }
    next();
  });
}

/**
 * @route   POST /api/products/:productId/media
 * @desc    Upload image/video files for a product
 */
router.post(
  "/products/:productId/media",
  authenticateToken,
  handleUploadMiddleware,
  productMediaController.uploadProductMedia
);

/**
 * @route   GET /api/products/:productId/media
 * @desc    Get all media for a product
 */
router.get(
  "/products/:productId/media",
  productMediaController.getProductMedia
);

/**
 * @route   PATCH /api/products/:productId/media/:mediaId
 * @desc    Update media metadata (altText, sortOrder, isPrimary)
 */
router.patch(
  "/products/:productId/media/:mediaId",
  authenticateToken,
  productMediaController.updateProductMedia
);

/**
 * @route   DELETE /api/products/:productId/media/:mediaId
 * @desc    Delete media file from Cloudinary and DB
 */
router.delete(
  "/products/:productId/media/:mediaId",
  authenticateToken,
  productMediaController.deleteProductMedia
);

module.exports = router;
