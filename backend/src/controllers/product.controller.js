"use strict";

const { getCachedData } = require("../util.js/cache");
const redisClient = require("../config/redis");

const itemModel = require("../models/item.model");
const productMediaModel = require("../models/productMedia.model");
const cloudinaryService = require("../services/cloudinary.service");

// Cache key patterns
const PRODUCT_LIST_PATTERN = "products:list:*";

async function invalidateProductCaches(productId) {
  try {
    // Invalidate all product list/filter/pagination combinations
    const listKeys = await redisClient.keys(PRODUCT_LIST_PATTERN);

    const keysToDelete = [...listKeys];

    if (productId !== undefined && productId !== null) {
      keysToDelete.push(
        `products:detail:${productId}`,
        `products:variants:${productId}`,
      );
    }

    if (keysToDelete.length > 0) {
      await redisClient.del(...keysToDelete);
    }
  } catch (error) {
    // Cache failure should not fail a successful database operation
    console.error("Product cache invalidation failed:", error.message);
  }
}

/**
 * GET /api/products
 * List active products with pagination & category filtering.
 */

async function listProducts(req, res) {
  try {
    // 1. Validate pagination
    const parsedPage = Number.parseInt(req.query.page, 10);
    const parsedLimit = Number.parseInt(req.query.limit, 10);

    const page =
      Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const limit =
      Number.isSafeInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : 20;

    // 2. Normalize category
    const categorySlug = String(
      req.query.category || req.query.categorySlug || "",
    )
      .trim()
      .toLowerCase();

    // 3. Normalize search
    const search = String(req.query.search || "")
      .trim()
      .replace(/\s+/g, " ");

    // Optional: prevent excessively long search queries
    if (search.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search query cannot exceed 100 characters",
      });
    }

    // 4. Generate consistent cache key
    const cacheKey = `products:list:${JSON.stringify({
      page,
      limit,
      categorySlug,
      search: search.toLowerCase(),
    })}`;

    // 5. Fetch cached or database results
    const response = await getCachedData(
      cacheKey,
      async () => {
        const result = await itemModel.listActiveItems({
          page,
          limit,
          categorySlug,
          search,
        });

        // 6. Transform database records
        const products = result.items.map((item) => ({
          id: String(item.id),
          itemId: item.id,
          name: item.name,
          category: item.category?.slug || "dresses",
          categoryId: item.category?.id,
          categoryName: item.category?.name,
          description: item.description,
          price: item.price,
          originalPrice: item.originalPrice,
          sizes: item.sizes,
          type: item.type,
          image: item.image,
          rating: item.rating,
          badge: item.isBestseller ? "BESTSELLER" : null,
          sku: item.sku,
          brand: item.brand,
          material: item.material,
          stockStatus: item.stockStatus,
        }));

        return {
          success: true,
          pagination: {
            total: result.total,
            page: result.page,
            limit,
            totalPages: result.totalPages,
            hasNextPage: result.page < result.totalPages,
            hasPreviousPage: result.page > 1,
          },
          count: products.length,
          products,
        };
      },
      300,
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching products:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products. Please try again later.",
    });
  }
}

/**
 * GET /api/products/:id
 * Get product details.
 */
async function getProduct(req, res) {
  try {
    const numericId = parseInt(req.params.id, 10);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await getCachedData(
      `products:detail:${numericId}`,
      () => itemModel.getItemById(numericId),
      120,
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching product detail:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product details",
    });
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

    await invalidateProductCaches(productId);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
}

/**
 * PUT /api/products/:id
 * Update an existing product. Admin only.
 */
async function updateProduct(req, res) {
  try {
    const numericId = parseInt(req.params.id, 10);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const exists = await itemModel.itemExists(numericId);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await itemModel.updateItem(numericId, req.body);

    const product = await itemModel.getItemById(numericId);

    await invalidateProductCaches(numericId);

    return res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating product:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
}

/**
 * PATCH /api/products/:id/status
 * Activate or deactivate a product. Admin only.
 */
async function setProductStatus(req, res) {
  try {
    const numericId = parseInt(req.params.id, 10);
    const { isActive } = req.body;

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "'isActive' boolean field is required",
      });
    }

    const updated = await itemModel.setItemActive(numericId, isActive);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await invalidateProductCaches(numericId);

    return res.json({
      success: true,
      message: `Product ${isActive ? "activated" : "deactivated"} successfully`,
      product: updated,
    });
  } catch (error) {
    console.error("Error setting product status:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product status",
    });
  }
}

/**
 * DELETE /api/products/:id
 * Delete product and clean up Cloudinary assets. Admin only.
 */
async function deleteProduct(req, res) {
  try {
    const numericId = parseInt(req.params.id, 10);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const exists = await itemModel.itemExists(numericId);

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const mediaList = await itemModel.deleteItem(numericId);

    await invalidateProductCaches(numericId);

    for (const media of mediaList) {
      try {
        await cloudinaryService.deleteMedia(media.publicId, media.mediaType);
      } catch (cloudinaryErr) {
        console.error(
          `Failed to delete Cloudinary asset ${media.publicId}:`,
          cloudinaryErr.message,
        );
      }
    }

    return res.json({
      success: true,
      message: "Product and associated media deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
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

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!colorName || !colorName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Color name is required",
      });
    }

    const color = await itemModel.upsertColor(numericId, colorName, hexCode);

    await invalidateProductCaches(numericId);

    return res.status(201).json({
      success: true,
      message: "Color added/updated successfully",
      color,
    });
  } catch (error) {
    console.error("Error adding product color:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add color",
    });
  }
}

/**
 * GET /api/products/:id/variants
 * Get all variants for a product.
 */
async function getVariants(req, res) {
  try {
    const numericId = parseInt(req.params.id, 10);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const variants = await getCachedData(
      `products:variants:${numericId}`,
      () => itemModel.getVariants(numericId),
      120,
    );

    return res.json({
      success: true,
      variants,
    });
  } catch (error) {
    console.error("Error fetching product variants:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch variants",
    });
  }
}

/**
 * POST /api/products/:id/variants
 * Upsert a variant. Admin only.
 */
async function upsertVariant(req, res) {
  try {
    const numericId = parseInt(req.params.id, 10);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const variant = await itemModel.upsertVariant({
      itemId: numericId,
      ...req.body,
    });

    await invalidateProductCaches(numericId);

    return res.status(201).json({
      success: true,
      message: "Variant saved successfully",
      variant,
    });
  } catch (error) {
    console.error("Error saving product variant:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save variant",
    });
  }
}

/**
 * PATCH /api/products/:id/variants/:variantId/status
 * Activate/deactivate a variant. Admin only.
 */
async function setVariantStatus(req, res) {
  try {
    const numericId = parseInt(req.params.id, 10);
    const numericVariantId = parseInt(req.params.variantId, 10);
    const { isActive } = req.body;

    if (
      !Number.isInteger(numericId) ||
      numericId <= 0 ||
      !Number.isInteger(numericVariantId) ||
      numericVariantId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product or variant ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "'isActive' boolean is required",
      });
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

    await invalidateProductCaches(numericId);

    return res.json({
      success: true,
      message: `Variant ${isActive ? "activated" : "deactivated"} successfully`,
      variant: updated,
    });
  } catch (error) {
    console.error("Error setting variant status:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update variant status",
    });
  }
}

const { getCachedData } = require("../utils/cache");

async function getLatestProducts(req, res) {
  try {
    const limit = 10;

    const cacheKey = `products:latest:${limit}`;

    const latestProducts = await getCachedData(
      cacheKey,
      async () => {
        return await itemModel.getLatestProducts(limit);
      },
      1800, // Cache for 30 minutes
    );

    return res.status(200).json({
      success: true,
      count: latestProducts.length,
      products: latestProducts,
    });
  } catch (error) {
    console.error("Error fetching latest products:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch latest products",
    });
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  getLatestProducts,
  setProductStatus,
  deleteProduct,
  addProductColor,
  getVariants,
  upsertVariant,
  setVariantStatus,
};
