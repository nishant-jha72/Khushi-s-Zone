"use strict";

const express = require("express");
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateUpsertVariant,
} = require("../middleware/productValidation");
const productController = require("../controllers/product.controller");

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Fetch categories from database
 */
router.get("/categories", async (req, res) => {
  try {
    const result = await query("SELECT id, name, slug, description, image_url as image FROM categories ORDER BY id ASC");
    res.json({
      success: true,
      categories: result.rows.map((cat) => ({
        id: cat.id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
      })),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
});

/**
 * @route   GET /api/products
 * @desc    Fetch active products with optional category/search filter & pagination
 */
router.get("/products", productController.listProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get full product details including images, colors, sizes, and active variants
 */
router.get("/products/:id", productController.getProduct);

/**
 * @route   POST /api/products
 * @desc    Create a new product (Admin only)
 */
router.post(
  "/products",
  authenticateToken,
  requireAdmin,
  validateCreateProduct,
  productController.createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product details (Admin only)
 */
router.put(
  "/products/:id",
  authenticateToken,
  requireAdmin,
  validateUpdateProduct,
  productController.updateProduct
);

/**
 * @route   PATCH /api/products/:id/status
 * @desc    Activate or deactivate a product (Admin only)
 */
router.patch(
  "/products/:id/status",
  authenticateToken,
  requireAdmin,
  productController.setProductStatus
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product item and all its Cloudinary media assets (Admin only)
 */
router.delete(
  "/products/:id",
  authenticateToken,
  requireAdmin,
  productController.deleteProduct
);

/**
 * @route   POST /api/products/:id/colors
 * @desc    Add or update a color option for a product (Admin only)
 */
router.post(
  "/products/:id/colors",
  authenticateToken,
  requireAdmin,
  productController.addProductColor
);

/**
 * @route   GET /api/products/:id/variants
 * @desc    Get all variants for a product
 */
router.get("/products/:id/variants", productController.getVariants);

/**
 * @route   POST /api/products/:id/variants
 * @desc    Create or update a product variant (Admin only)
 */
router.post(
  "/products/:id/variants",
  authenticateToken,
  requireAdmin,
  validateUpsertVariant,
  productController.upsertVariant
);

/**
 * @route   PATCH /api/products/:id/variants/:variantId/status
 * @desc    Activate or deactivate a product variant (Admin only)
 */
router.patch(
  "/products/:id/variants/:variantId/status",
  authenticateToken,
  requireAdmin,
  productController.setVariantStatus
);

module.exports = router;
