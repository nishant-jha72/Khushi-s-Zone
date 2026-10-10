"use strict";

/**
 * adminMiddleware.js
 * Restricts access to routes to users with is_admin = true in JWT token payload.
 */

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ success: false, message: "Access denied: Admin permissions required" });
  }

  next();
}

module.exports = { requireAdmin };
