const db = require("../config/db");

const NewsletterModel = require("../models/newsletter.model");

exports.subscribeUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res
        .status(400)
        .json({ success: false, message: "Valid email address is required." });
    }

    await NewsletterModel.subscribe(email);
    return res.status(200).json({
      success: true,
      message: "Successfully subscribed to the weekly newsletter!",
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

exports.unsubscribeUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email address is required." });
    }

    await NewsletterModel.unsubscribe(email);
    return res.status(200).json({
      success: true,
      message: "Successfully unsubscribed from newsletters.",
    });
  } catch (error) {
    console.error("Newsletter unsubscription error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

exports.getLatestProducts = async () => {
  const latestProducts = await db.query(
    "SELECT id, name, price, image_url FROM items ORDER BY created_at DESC LIMIT 5",
  );
  return latestProducts.rows;
};
