"use strict";

/**
 * productValidation.js
 * Request validation logic for products and variants.
 */

function validateCreateProduct(req, res, next) {
  const { name, categoryId, description, price } = req.body;

  const errors = [];

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push("Product name is required.");
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    errors.push("Product description is required.");
  }

  if (price === undefined || price === null || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
    errors.push("Price must be a positive number.");
  }

  if (req.body.originalPrice !== undefined && req.body.originalPrice !== null) {
    if (isNaN(parseFloat(req.body.originalPrice)) || parseFloat(req.body.originalPrice) < 0) {
      errors.push("Original price must be a non-negative number.");
    }
  }

  if (categoryId !== undefined && categoryId !== null && (isNaN(parseInt(categoryId, 10)) || parseInt(categoryId, 10) <= 0)) {
    errors.push("Category ID must be a valid positive integer.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  next();
}

function validateUpdateProduct(req, res, next) {
  const { price, originalPrice, categoryId } = req.body;
  const errors = [];

  if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
    errors.push("Price must be a positive number.");
  }

  if (originalPrice !== undefined && originalPrice !== null && (isNaN(parseFloat(originalPrice)) || parseFloat(originalPrice) < 0)) {
    errors.push("Original price must be a non-negative number.");
  }

  if (categoryId !== undefined && categoryId !== null && (isNaN(parseInt(categoryId, 10)) || parseInt(categoryId, 10) <= 0)) {
    errors.push("Category ID must be a valid positive integer.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  next();
}

function validateUpsertVariant(req, res, next) {
  const { size, price, originalPrice, stockQuantity } = req.body;
  const errors = [];

  if (!size || typeof size !== "string" || !size.trim()) {
    errors.push("Variant size is required.");
  }

  if (price !== undefined && price !== null && (isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
    errors.push("Variant price must be a positive number.");
  }

  if (originalPrice !== undefined && originalPrice !== null && (isNaN(parseFloat(originalPrice)) || parseFloat(originalPrice) < 0)) {
    errors.push("Variant original price must be a non-negative number.");
  }

  if (stockQuantity !== undefined && stockQuantity !== null && (isNaN(parseInt(stockQuantity, 10)) || parseInt(stockQuantity, 10) < 0)) {
    errors.push("Stock quantity must be a non-negative integer.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  next();
}

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateUpsertVariant,
};
