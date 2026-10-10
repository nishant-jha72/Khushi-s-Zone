const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

/**
 * Helper to upload buffer stream to Cloudinary
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {Object} options - Upload options (folder, resource_type, etc.)
 * @returns {Promise<Object>} Cloudinary upload result
 */
function uploadStream(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/**
 * Upload single media file to Cloudinary
 * @param {Object} file - Express file object from Multer
 * @param {string|number} productId - Product / Item ID
 * @returns {Promise<Object>}
 */
async function uploadMedia(file, productId) {
  const isVideo = file.mimetype.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";
  const folder = `products/${productId}`;

  const options = {
    folder,
    resource_type: resourceType,
  };

  const result = await uploadStream(file.buffer, options);

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    mediaType: isVideo ? "video" : "image",
    format: result.format,
    width: result.width,
    height: result.height,
    duration: result.duration || null,
  };
}

/**
 * Delete single asset from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @param {string} mediaType - "image" or "video"
 * @returns {Promise<Object>}
 */
async function deleteMedia(publicId, mediaType = "image") {
  const resourceType = mediaType === "video" ? "video" : "image";
  return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Generate optimized/transformed URL
 * @param {string} publicId
 * @param {Object} transformations
 * @returns {string}
 */
function generateOptimizedUrl(publicId, transformations = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    quality: "auto",
    fetch_format: "auto",
    ...transformations,
  });
}

module.exports = {
  uploadMedia,
  deleteMedia,
  generateOptimizedUrl,
};
