const express = require("express");
const { query } = require("../config/db");

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
        image: cat.image
      }))
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
});

/**
 * @route   GET /api/products
 * @desc    Fetch all women's clothing items with category table reference
 */
router.get("/products", async (req, res) => {
  try {
    const { category, search } = req.query;

    let sql = `
      SELECT i.id, i.name, i.description, i.price, i.original_price, i.sizes, i.type, i.image_url, i.rating, i.is_bestseller,
             c.id as category_id, c.name as category_name, c.slug as category_slug
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE 1=1
    `;

    const params = [];

    if (category) {
      params.push(category);
      sql += ` AND (c.slug = $${params.length} OR i.type ILIKE $${params.length})`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (i.name ILIKE $${params.length} OR i.description ILIKE $${params.length} OR i.type ILIKE $${params.length})`;
    }

    sql += " ORDER BY i.id ASC;";

    const result = await query(sql, params);

    const products = result.rows.map((item) => ({
      id: item.id.toString(),
      itemId: item.id,
      name: item.name,
      category: item.category_slug || "dresses",
      categoryId: item.category_id,
      categoryName: item.category_name,
      description: item.description,
      price: parseFloat(item.price),
      originalPrice: item.original_price ? parseFloat(item.original_price) : undefined,
      sizes: item.sizes || ["XS", "S", "M", "L", "XL"],
      type: item.type,
      image: item.image_url,
      rating: parseFloat(item.rating || 4.8),
      badge: item.is_bestseller ? "BESTSELLER" : undefined
    }));

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
});

module.exports = router;
