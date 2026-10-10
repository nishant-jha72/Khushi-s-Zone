const cloudinaryService = require("../services/cloudinary.service");
const productMediaModel = require("../models/productMedia.model");

/**
 * Upload Media Files for a Product
 * POST /api/products/:productId/media
 */
async function uploadProductMedia(req, res) {
  const { productId } = req.params;

  if (!productId || isNaN(parseInt(productId, 10))) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  const numericProductId = parseInt(productId, 10);

  // 1. Verify Product Exists
  const exists = await productMediaModel.checkProductExists(numericProductId);
  if (!exists) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  // 2. Verify Files Provided
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "No media files provided" });
  }

  // 3. Enforce 10-image maximum limit per product
  const existingImageCount = await productMediaModel.countImagesByProductId(numericProductId);
  const newImageCount = req.files.filter((f) => f.mimetype.startsWith("image/")).length;

  if (existingImageCount + newImageCount > 10) {
    return res.status(400).json({
      success: false,
      message: `Product image limit reached. Existing: ${existingImageCount}, upload attempted: ${newImageCount}. Maximum allowed: 10 images per product.`,
    });
  }

  const uploadedAssets = [];
  const insertedMediaRecords = [];

  try {
    let currentSortOrder = await productMediaModel.getNextSortOrder(numericProductId);
    const existingMedia = await productMediaModel.getMediaByProductId(numericProductId);
    let hasPrimary = existingMedia.some((m) => m.isPrimary);

    // Upload to Cloudinary sequentially or in parallel
    for (const file of req.files) {
      const uploadResult = await cloudinaryService.uploadMedia(file, numericProductId);
      uploadedAssets.push(uploadResult);

      const isPrimaryCandidate = !hasPrimary && uploadResult.mediaType === "image";
      if (isPrimaryCandidate) {
        hasPrimary = true;
      }

      // Insert into DB
      const dbRecord = await productMediaModel.insertProductMedia({
        productId: numericProductId,
        mediaType: uploadResult.mediaType,
        mediaUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        altText: req.body.altText || null,
        sortOrder: currentSortOrder++,
        isPrimary: isPrimaryCandidate,
      });

      insertedMediaRecords.push(dbRecord);
    }

    return res.status(201).json({
      success: true,
      message: "Product media uploaded successfully",
      media: insertedMediaRecords,
    });
  } catch (error) {
    console.error("❌ Error uploading product media:", error);

    // Rollback: Delete any Cloudinary uploaded assets for this batch
    if (uploadedAssets.length > 0) {
      console.log(`⚠️ Cleaning up ${uploadedAssets.length} Cloudinary asset(s) due to error...`);
      for (const asset of uploadedAssets) {
        try {
          await cloudinaryService.deleteMedia(asset.publicId, asset.mediaType);
        } catch (cleanupErr) {
          console.error(`❌ Cloudinary cleanup failed for ${asset.publicId}:`, cleanupErr.message);
        }
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload product media",
    });
  }
}

/**
 * Get Product Media
 * GET /api/products/:productId/media
 */
async function getProductMedia(req, res) {
  const { productId } = req.params;

  if (!productId || isNaN(parseInt(productId, 10))) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  const numericProductId = parseInt(productId, 10);

  const exists = await productMediaModel.checkProductExists(numericProductId);
  if (!exists) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  try {
    const media = await productMediaModel.getMediaByProductId(numericProductId);
    return res.json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("❌ Error fetching product media:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch product media" });
  }
}

/**
 * Update Media Metadata
 * PATCH /api/products/:productId/media/:mediaId
 */
async function updateProductMedia(req, res) {
  const { productId, mediaId } = req.params;

  if (!productId || isNaN(parseInt(productId, 10))) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }
  if (!mediaId || isNaN(parseInt(mediaId, 10))) {
    return res.status(400).json({ success: false, message: "Invalid media ID" });
  }

  const numericProductId = parseInt(productId, 10);
  const numericMediaId = parseInt(mediaId, 10);

  const existingMedia = await productMediaModel.getMediaByIdAndProduct(numericMediaId, numericProductId);
  if (!existingMedia) {
    return res.status(404).json({ success: false, message: "Media record not found for this product" });
  }

  const { altText, sortOrder, isPrimary } = req.body;

  if (altText === undefined && sortOrder === undefined && isPrimary === undefined) {
    return res.status(400).json({ success: false, message: "No metadata fields provided to update" });
  }

  try {
    const updatedMedia = await productMediaModel.updateMediaMetadata(numericMediaId, numericProductId, {
      altText,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : undefined,
      isPrimary: isPrimary !== undefined ? Boolean(isPrimary) : undefined,
    });

    return res.json({
      success: true,
      message: "Media metadata updated successfully",
      media: updatedMedia,
    });
  } catch (error) {
    console.error("❌ Error updating product media metadata:", error);
    return res.status(500).json({ success: false, message: "Failed to update product media metadata" });
  }
}

/**
 * Delete Product Media
 * DELETE /api/products/:productId/media/:mediaId
 */
async function deleteProductMedia(req, res) {
  const { productId, mediaId } = req.params;

  if (!productId || isNaN(parseInt(productId, 10))) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }
  if (!mediaId || isNaN(parseInt(mediaId, 10))) {
    return res.status(400).json({ success: false, message: "Invalid media ID" });
  }

  const numericProductId = parseInt(productId, 10);
  const numericMediaId = parseInt(mediaId, 10);

  // 1. Find media record
  const existingMedia = await productMediaModel.getMediaByIdAndProduct(numericMediaId, numericProductId);
  if (!existingMedia) {
    return res.status(404).json({ success: false, message: "Media record not found for this product" });
  }

  try {
    // 2. Delete asset from Cloudinary
    try {
      await cloudinaryService.deleteMedia(existingMedia.publicId, existingMedia.mediaType);
    } catch (cloudinaryErr) {
      console.error(`⚠️ Cloudinary deletion failed for public_id ${existingMedia.publicId}:`, cloudinaryErr.message);
      // Proceed or fail safely as required
    }

    // 3. Delete record from PostgreSQL
    await productMediaModel.deleteMediaRecord(numericMediaId, numericProductId);

    return res.json({
      success: true,
      message: "Product media deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting product media:", error);
    return res.status(500).json({ success: false, message: "Failed to delete product media" });
  }
}

module.exports = {
  uploadProductMedia,
  getProductMedia,
  updateProductMedia,
  deleteProductMedia,
};
