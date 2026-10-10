const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { query } = require("../config/db");
const { sendVerificationEmail, sendWelcomeConfirmationEmail } = require("../services/emailService");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Helper to generate JWT tokens
function generateTokens(user) {
  const payload = { userId: user.id, email: user.email, name: user.name, isAdmin: Boolean(user.is_admin) };
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}


/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with Name, Email & Password. Sends verification email.
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check existing user
    const existing = await query("SELECT id, is_verified FROM users WHERE email = $1", [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: "An account with this email already exists" });
    }

    // Encrypt password with Bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await query(
      `INSERT INTO users (name, email, password, verification_token, verification_token_expires, is_verified)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING id, name, email, is_verified, created_at;`,
      [name.trim(), cleanEmail, hashedPassword, verificationToken, expiresAt]
    );

    const newUser = result.rows[0];

    // Dispatch verification email
    await sendVerificationEmail(cleanEmail, name, verificationToken);

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      verificationToken, // Provided for easy development testing
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isVerified: false
      }
    });
  } catch (error) {
    console.error("Error in /register:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email via token & send welcome confirmation email
 */
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Verification token is required" });
    }

    const userRes = await query(
      "SELECT * FROM users WHERE verification_token = $1",
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification token" });
    }

    const user = userRes.rows[0];

    // Update user status
    await query(
      `UPDATE users
       SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1;`,
      [user.id]
    );

    // Send Welcome Confirmation email
    await sendWelcomeConfirmationEmail(user.email, user.name);

    // Generate JWT Access & Refresh Tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store Refresh Token in DB
    await query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

    res.json({
      success: true,
      message: "Email verified successfully! Welcome to Khushi's Zone.",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
        avatar: user.avatar || "",
        isVerified: true,
        isAdmin: Boolean(user.is_admin)
      }
    });
  } catch (error) {
    console.error("Error in /verify-email:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Log in user with Email & Password. Generates Access & Refresh tokens.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userRes = await query("SELECT * FROM users WHERE email = $1", [cleanEmail]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = userRes.rows[0];

    if (!user.password) {
      return res.status(400).json({ success: false, message: "This account was created using Google Sign In. Please use Google Login." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before signing in. Check your inbox for the verification link.",
        needsVerification: true
      });
    }

    // Generate JWT Access & Refresh Tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token in DB
    await query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

    res.json({
      success: true,
      message: "Logged in successfully!",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
        avatar: user.avatar || "",
        isVerified: user.is_verified,
        isAdmin: Boolean(user.is_admin)
      }
    });
  } catch (error) {
    console.error("Error in /login:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @route   POST /api/auth/google
 * @desc    OAuth 2.0 login/register — verifies Google ID token from GIS
 */
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: "Google ID token (credential) is required" });
    }

    if (!googleClient || !GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith("mock")) {
      return res.status(503).json({
        success: false,
        message: "Google Sign-In is not configured. Set a valid GOOGLE_CLIENT_ID in the backend .env."
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({ success: false, message: "Invalid Google token payload" });
    }

    const cleanEmail = payload.email.toLowerCase().trim();
    const name = payload.name || cleanEmail.split("@")[0];
    const googleId = payload.sub;
    const avatar = payload.picture || "";

    let userRes = await query("SELECT * FROM users WHERE email = $1 OR google_id = $2", [cleanEmail, googleId]);
    let user;

    if (userRes.rows.length === 0) {
      const insertRes = await query(
        `INSERT INTO users (name, email, google_id, avatar, is_verified)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING *;`,
        [name, cleanEmail, googleId, avatar]
      );
      user = insertRes.rows[0];
      await sendWelcomeConfirmationEmail(cleanEmail, name);
    } else {
      user = userRes.rows[0];
      await query(
        `UPDATE users
         SET google_id = COALESCE(google_id, $1),
             avatar = CASE WHEN avatar IS NULL OR avatar = '' THEN $2 ELSE avatar END,
             is_verified = TRUE,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [googleId, avatar, user.id]
      );
      userRes = await query("SELECT * FROM users WHERE id = $1", [user.id]);
      user = userRes.rows[0];
    }

    const { accessToken, refreshToken } = generateTokens(user);
    await query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

    res.json({
      success: true,
      message: "Google OAuth sign in successful!",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
        avatar: user.avatar || avatar || "",
        isVerified: true,
        isAdmin: Boolean(user.is_admin)
      }
    });
  } catch (error) {
    console.error("Error in /google:", error);
    res.status(401).json({ success: false, message: "Google authentication failed. Invalid or expired token." });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Issue new Access Token using Refresh Token
 */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token is required" });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
      }

      const userRes = await query("SELECT * FROM users WHERE id = $1 AND refresh_token = $2", [decoded.userId, refreshToken]);

      if (userRes.rows.length === 0) {
        return res.status(403).json({ success: false, message: "Refresh token revoked or user not found" });
      }

      const user = userRes.rows[0];
      const tokens = generateTokens(user);

      // Save new refresh token (Rotation)
      await query("UPDATE users SET refresh_token = $1 WHERE id = $2", [tokens.refreshToken, user.id]);

      res.json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    });
  } catch (error) {
    console.error("Error in /refresh:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Log out user and invalidate refresh token
 */
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query("UPDATE users SET refresh_token = NULL WHERE refresh_token = $1", [refreshToken]);
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error logging out" });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Fetch authenticated user profile details
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userRes = await query("SELECT id, name, email, phone, address, city, state, pincode, avatar, is_verified, is_admin, created_at FROM users WHERE id = $1", [req.user.userId]);

    if (userRes.rows.length === 0) {
      return res.status(444).json({ success: false, message: "User not found" });
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
        isAdmin: Boolean(u.is_admin),
        createdAt: u.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user profile" });
  }
});

/**
 * @route   POST /api/auth/make-admin
 * @desc    Bootstrap: Promote a user to admin using a secret key (one-time setup)
 */
router.post("/make-admin", async (req, res) => {
  try {
    const { email, secret } = req.body;
    const ADMIN_SECRET = process.env.ADMIN_BOOTSTRAP_SECRET || "KhushiZoneAdmin@2026!";

    if (!ADMIN_SECRET) {
      return res.status(503).json({ success: false, message: "Admin bootstrap is not configured on this server." });
    }

    if (!secret || secret !== ADMIN_SECRET) {
      return res.status(403).json({ success: false, message: "Invalid bootstrap secret." });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const userRes = await query("SELECT id, name, email, is_admin FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No user found with this email. Register first." });
    }

    const user = userRes.rows[0];
    if (user.is_admin) {
      return res.json({ success: true, message: `${user.name} is already an admin.` });
    }

    await query("UPDATE users SET is_admin = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [user.id]);

    res.json({
      success: true,
      message: `✅ ${user.name} (${user.email}) has been granted admin access. Please log in again to refresh your token.`
    });
  } catch (error) {
    console.error("Error in /make-admin:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
