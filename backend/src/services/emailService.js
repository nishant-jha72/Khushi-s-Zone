const nodemailer = require("nodemailer");

// Create transport or fallback test transport
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: process.env.EMAIL_PORT === "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Ethereal test account for local development
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.log("ℹ️  Nodemailer falling back to console logger mode.");
      transporter = null;
    }
  }
  return transporter;
}

/**
 * Send Verification Email upon user registration
 */
async function sendVerificationEmail(email, name, token) {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verificationLink = `${clientUrl}?verify_token=${token}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #EDE5D5; border-radius: 12px; padding: 24px; background-color: #FAF7F2; color: #4A2925;">
      <h2 style="font-family: Georgia, serif; color: #4A2925; margin-top: 0;">Welcome to Khushi's Zone!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for creating an account with Khushi's Zone — Your Points of Happiness. Please verify your email address to activate your account and start shopping.</p>
      
      <div style="margin: 28px 0; text-align: center;">
        <a href="${verificationLink}" style="background-color: #4A2925; color: #F7F2EA; padding: 12px 28px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block;">
          Verify Email Address
        </a>
      </div>

      <p style="font-size: 12px; color: #8C7A6B;">Verification Code / Token: <code style="background: #EDE5D5; padding: 2px 6px; border-radius: 4px;">${token}</code></p>
      <p style="font-size: 12px; color: #8C7A6B;">If you did not request this, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #EDE5D5; margin: 20px 0;" />
      <p style="font-size: 11px; color: #8C7A6B; text-align: center;">Khushi's Zone © 2026. All rights reserved.</p>
    </div>
  `;

  try {
    const activeTransporter = await getTransporter();
    if (activeTransporter) {
      const info = await activeTransporter.sendMail({
        from: '"Khushi\'s Zone" <noreply@khushizone.com>',
        to: email,
        subject: "Verify Your Email Address - Khushi's Zone",
        html: htmlContent,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📧 Verification email preview URL: ${previewUrl}`);
      }
    }
    console.log(`✉️  [Email Dispatch] Verification code for ${email}: ${token}`);
    console.log(`🔗 Verification Link: ${verificationLink}`);
  } catch (err) {
    console.error("❌ Failed to send verification email:", err.message);
  }
}

/**
 * Send Confirmation Email upon successful email verification / account activation
 */
async function sendWelcomeConfirmationEmail(email, name) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #EDE5D5; border-radius: 12px; padding: 24px; background-color: #FAF7F2; color: #4A2925;">
      <h2 style="font-family: Georgia, serif; color: #4A2925; margin-top: 0;">Account Verified Successfully! 🎉</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your email address has been verified! Welcome to Khushi's Zone family.</p>
      <p>You can now save your wishlist, view past orders, track deliveries, and enjoy exclusive member offers.</p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${process.env.CLIENT_URL || "http://localhost:5173"}" style="background-color: #4A2925; color: #F7F2EA; padding: 12px 28px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block;">
          Start Shopping
        </a>
      </div>
      <hr style="border: 0; border-top: 1px solid #EDE5D5; margin: 20px 0;" />
      <p style="font-size: 11px; color: #8C7A6B; text-align: center;">Khushi's Zone © 2026. All rights reserved.</p>
    </div>
  `;

  try {
    const activeTransporter = await getTransporter();
    if (activeTransporter) {
      await activeTransporter.sendMail({
        from: '"Khushi\'s Zone" <noreply@khushizone.com>',
        to: email,
        subject: "Welcome to Khushi's Zone - Account Confirmed!",
        html: htmlContent,
      });
    }
    console.log(`✉️  [Email Dispatch] Welcome confirmation email sent to ${email}`);
  } catch (err) {
    console.error("❌ Failed to send welcome email:", err.message);
  }
}

module.exports = {
  sendVerificationEmail,
  sendWelcomeConfirmationEmail,
};
