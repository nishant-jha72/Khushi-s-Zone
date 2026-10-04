const express = require("express");
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile details
 */
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userRes = await query(
      "SELECT id, name, email, phone, address, city, state, pincode, avatar, is_verified, created_at FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const u = userRes.rows[0];
    res.json({
      success: true,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || "",
        address: u.address || "",
        city: u.city || "",
        state: u.state || "",
        pincode: u.pincode || "",
        avatar: u.avatar || "",
        isVerified: u.is_verified,
        createdAt: u.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile details (Name, Phone, Address, City, State, Pincode)
 */
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode } = req.body;

    const updateRes = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           city = COALESCE($4, city),
           state = COALESCE($5, state),
           pincode = COALESCE($6, pincode),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, name, email, phone, address, city, state, pincode, avatar, is_verified;`,
      [name, phone, address, city, state, pincode, req.user.userId]
    );

    const u = updateRes.rows[0];

    res.json({
      success: true,
      message: "Account details updated successfully!",
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || "",
        address: u.address || "",
        city: u.city || "",
        state: u.state || "",
        pincode: u.pincode || "",
        avatar: u.avatar || "",
        isVerified: u.is_verified
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

module.exports = router;
