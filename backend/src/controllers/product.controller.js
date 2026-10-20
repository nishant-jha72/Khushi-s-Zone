"use strict";

/**
 * product.controller.js
 * Express controllers for managing products, colors, and variants.
 */

const itemModel = require("../models/item.model");
const productMediaModel = require("../models/productMedia.model");
const cloudinaryService = require("../services/cloudinary.service");

/**
 * GET /api/products
 * List active products with pagination & category filtering.
 */
async function listProducts(req, res) {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const categorySlug = req.query.category || req.query.categorySlug;
    const search = req.query.search;

    const result = await itemModel.listActiveItems({
      page,
      limit,
      categorySlug,
      search,
    });

    // Format for existing frontend contract
    const products = result.items.map((item) => ({
      id: item.id.toString(),
      itemId: item.id,
      name: item.name,
      category: item.category.slug || "dresses",
      categoryId: item.category.id,
      categoryName: item.category.name,
      description: item.description,
      price: item.price,
      originalPrice: item.originalPrice,
      sizes: item.sizes,
      type: item.type,
      image: item.image,
      rating: item.rating,
      badge: item.isBestseller ? "BESTSELLER" : undefined,
      sku: item.sku,
      brand: item.brand,
      material: item.material,
      stockStatus: item.stockStatus,
    }));

    res.json({
      success: true,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }
}

/**
 * GET /api/products/:id
 * Get full single product detail with gallery, colors, sizes, and variants.
 */
async function getProduct(req, res) {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId) || numericId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const product = await itemModel.getItemById(numericId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching product detail:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch product details" });
  }
}

/**
 * POST /api/products
 * Create a new product. Admin only.
 */
async function createProduct(req, res) {
  try {
    const productId = await itemModel.createItem(req.body);
    const product = await itemModel.getItemById(productId);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create product" });
  }
}

/**
 * PUT /api/products/:id
 * Update an existing product. Admin only.
 */
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId) || numericId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const exists = await itemModel.itemExists(numericId);
    if (!exists) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    await itemModel.updateItem(numericId, req.body);
    const product = await itemModel.getItemById(numericId);

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update product" });
  }
}

/**
 * PATCH /api/products/:id/status
 * Activate or deactivate a product. Admin only.
 */
async function setProductStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "'isActive' boolean field is required",
      });
    }

    const updated = await itemModel.setItemActive(numericId, isActive);
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      message: `Product ${isActive ? "activated" : "deactivated"} successfully`,
      product: updated,
    });
  } catch (error) {
    console.error("Error setting product status:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update product status" });
  }
}

/**
 * DELETE /api/products/:id
 * Delete product and clean up all Cloudinary assets. Admin only.
 */
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId) || numericId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const exists = await itemModel.itemExists(numericId);
    if (!exists) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const mediaList = await itemModel.deleteItem(numericId);

    for (const media of mediaList) {
      try {
        await cloudinaryService.deleteMedia(media.publicId, media.mediaType);
      } catch (cloudinaryErr) {
        console.error(
          `⚠️ Failed to delete Cloudinary asset ${media.publicId}:`,
          cloudinaryErr.message,
        );
      }
    }

    res.json({
      success: true,
      message: "Product and associated media deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete product" });
  }
}

/**
 * POST /api/products/:id/colors
 * Add or update a product color option. Admin only.
 */
async function addProductColor(req, res) {
  try {
    const { id } = req.params;
    const { colorName, hexCode } = req.body;
    const numericId = parseInt(id, 10);

    if (!colorName || !colorName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Color name is required" });
    }

    const color = await itemModel.upsertColor(numericId, colorName, hexCode);

    res.status(201).json({
      success: true,
      message: "Color added/updated successfully",
      color,
    });
  } catch (error) {
    console.error("Error adding product color:", error);
    res.status(500).json({ success: false, message: "Failed to add color" });
  }
}

/**
 * GET /api/products/:id/variants
 * Get all variants for a product.
 */
async function getVariants(req, res) {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    const variants = await itemModel.getVariants(numericId);
    res.json({
      success: true,
      variants,
    });
  } catch (error) {
    console.error("Error fetching product variants:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch variants" });
  }
}

/**
 * POST /api/products/:id/variants
 * Upsert a variant. Admin only.
 */
async function upsertVariant(req, res) {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    const variant = await itemModel.upsertVariant({
      itemId: numericId,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Variant saved successfully",
      variant,
    });
  } catch (error) {
    console.error("Error saving variant:", error);
    res.status(500).json({ success: false, message: "Failed to save variant" });
  }
}

/**
 * PATCH /api/products/:id/variants/:variantId/status
 * Activate/deactivate a variant. Admin only.
 */
async function setVariantStatus(req, res) {
  try {
    const { id, variantId } = req.params;
    const { isActive } = req.body;

    const numericId = parseInt(id, 10);
    const numericVariantId = parseInt(variantId, 10);

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "'isActive' boolean is required" });
    }

    const updated = await itemModel.setVariantActive(
      numericVariantId,
      numericId,
      isActive,
    );
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Variant not found for this product",
      });
    }

    res.json({
      success: true,
      message: `Variant ${isActive ? "activated" : "deactivated"} successfully`,
      variant: updated,
    });
  } catch (error) {
    console.error("Error setting variant status:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update variant status" });
  }
}


module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  setProductStatus,
  deleteProduct,
  addProductColor,
  getVariants,
  upsertVariant,
  setVariantStatus,
};
