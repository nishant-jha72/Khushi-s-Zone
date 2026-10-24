const nodemailer = require("nodemailer");
const { getDailySalesData } = require("../controllers/product.controller");
// Create transport or fallback test transport
let transporter = null;

const inr = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const prettyDate = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const th =
  "padding:8px 10px;text-align:left;background:#EDE5D5;font-size:12px;color:#4A2925;";
const td = "padding:8px 10px;border-bottom:1px solid #EDE5D5;font-size:13px;";

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


function reportTable(headers, rows, emptyMsg) {
  if (!rows.length)
    return `<p style="font-size:13px;color:#8C7A6B;">${emptyMsg}</p>`;
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
    <tr>${headers.map((h) => `<th style="${th}">${h}</th>`).join("")}</tr>
    ${rows.map((r) => `<tr>${r.map((c) => `<td style="${td}">${c}</td>`).join("")}</tr>`).join("")}
  </table>`;
}

const reportCard = (label, value) =>
  `<td style="background:#fff;border:1px solid #EDE5D5;border-radius:8px;padding:14px;text-align:center;">
     <div style="font-size:11px;color:#8C7A6B;text-transform:uppercase;letter-spacing:.5px;">${label}</div>
     <div style="font-size:20px;font-weight:bold;color:#4A2925;margin-top:4px;">${value}</div>
   </td>`;

function buildDailySalesHtml(d) {
  const h3 = (t) =>
    `<h3 style="font-family:Georgia,serif;color:#4A2925;margin:24px 0 8px;">${t}</h3>`;
  return `
  <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;border:1px solid #EDE5D5;border-radius:12px;padding:24px;background:#FAF7F2;color:#4A2925;">
    <h2 style="font-family:Georgia,serif;margin:0;">Daily Sales Report</h2>
    <p style="color:#8C7A6B;font-size:13px;margin:4px 0 20px;">Khushi's Zone · ${prettyDate(d.date)}</p>

    <table style="width:100%;border-spacing:8px;margin:0 -8px;"><tr>
      ${reportCard("Orders", d.ordersCount)}
      ${reportCard("Revenue", inr(d.revenue))}
      ${reportCard("Avg. Order", inr(d.aov))}
      ${reportCard("Cancelled", d.cancelled)}
    </tr></table>

    ${h3("Product-wise Sales")}
    ${reportTable(
      ["Product", "Units", "Amount"],
      d.byProduct.map((p) => [esc(p.name), p.units, inr(p.revenue)]),
      "No product sales recorded today.",
    )}

    ${h3("Payment Methods")}
    ${reportTable(
      ["Method", "Orders", "Amount"],
      d.byPayment.map((p) => [esc(p.payment_method), p.orders, inr(p.revenue)]),
      "No paid orders today.",
    )}

    ${h3("Order Details")}
    ${reportTable(
      ["Order #", "Time", "Amount", "Status", "Payment"],
      d.orders.map((o) => [
        esc(o.order_number),
        o.time,
        inr(o.total_amount),
        esc(o.status),
        esc(`${o.payment_method} (${o.payment_status})`),
      ]),
      "No orders placed today.",
    )}
    ${d.orders.length === 100 ? `<p style="font-size:11px;color:#8C7A6B;">Showing the latest 100 orders.</p>` : ""}

    <hr style="border:0;border-top:1px solid #EDE5D5;margin:20px 0;" />
    <p style="font-size:11px;color:#8C7A6B;text-align:center;">Automated report · Cancelled orders are excluded from revenue · Khushi's Zone © 2026</p>
  </div>`;
}

/**
 * Send the daily sales report to the admin. `data` comes from getDailySalesData().
 */
async function sendDailySalesReportEmail(data) {
  const to = "Jhanishant985@gmail.com";
  if (!to)
    return console.error("❌ Daily sales report skipped: ADMIN_EMAIL not set");

  try {
    const activeTransporter = await getTransporter();
    if (!activeTransporter)
      return console.log("ℹ️  No mail transporter; daily report not sent.");

    const info = await activeTransporter.sendMail({
      from: '"Khushi\'s Zone Reports" <noreply@khushizone.com>',
      to,
      subject: `Daily Sales Report – ${prettyDate(data.date)} | ${data.ordersCount} orders, ${inr(data.revenue)}`,
      html: buildDailySalesHtml(data),
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`📧 Daily report preview URL: ${previewUrl}`);
    console.log(`📊 Daily sales report sent for ${data.date}`);
  } catch (err) {
    console.error("❌ Failed to send daily sales report:", err.message);
  }
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
    console.log(
      `✉️  [Email Dispatch] Verification code for ${email}: ${token}`,
    );
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
    console.log(
      `✉️  [Email Dispatch] Welcome confirmation email sent to ${email}`,
    );
  } catch (err) {
    console.error("❌ Failed to send welcome email:", err.message);
  }
}

module.exports = {
  sendVerificationEmail,
  sendWelcomeConfirmationEmail,
  sendDailySalesReportEmail,
};

/**
 * Send order notification email to admin
 */
async function sendOrderNotificationEmail(orderDetails) {
  const to = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!to) {
    console.log("ℹ️  ORDER_NOTIFICATION_EMAIL not set, skipping admin notification");
    return;
  }

  try {
    const activeTransporter = await getTransporter();
    if (!activeTransporter) {
      console.log("ℹ️  No mail transporter; order notification not sent.");
      return;
    }

    const {
      orderNumber,
      createdAt,
      orderStatus,
      paymentMethod,
      paymentStatus,
      subtotal,
      deliveryFee = 0,
      discountAmount = 0,
      totalAmount,
      customer,
      address,
      items,
      manufacturers
    } = orderDetails;

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #EDE5D5;font-size:13px;">${esc(item.product_name || item.name)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #EDE5D5;font-size:13px;">${item.quantity}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #EDE5D5;font-size:13px;">${item.size || 'N/A'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #EDE5D5;font-size:13px;">${inr(item.unit_price || item.price)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #EDE5D5;font-size:13px;">${inr(item.line_total || (item.unit_price || item.price) * item.quantity)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #EDE5D5;font-size:13px;">${esc(item.manufacturer_name || '')}</td>
      </tr>
    `).join('');

    const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;border:1px solid #EDE5D5;border-radius:12px;padding:24px;background:#FAF7F2;color:#4A2925;">
      <h2 style="font-family:Georgia,serif;margin:0;">New Order Notification</h2>
      <p style="color:#8C7A6B;font-size:13px;margin:4px 0 20px;">Khushi's Zone - Order Alert</p>

      <h3 style="font-family:Georgia,serif;color:#4A2925;margin:20px 0 8px;">Order Details</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;font-size:13px;"><strong>Order Number:</strong></td><td style="padding:6px 0;font-size:13px;">${esc(orderNumber)}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;"><strong>Order Date:</strong></td><td style="padding:6px 0;font-size:13px;">${new Date(createdAt).toLocaleString('en-IN')}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;"><strong>Order Status:</strong></td><td style="padding:6px 0;font-size:13px;">${esc(orderStatus)}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;"><strong>Payment Method:</strong></td><td style="padding:6px 0;font-size:13px;">${esc(paymentMethod)}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;"><strong>Payment Status:</strong></td><td style="padding:6px 0;font-size:13px;">${esc(paymentStatus)}</td></tr>
      </table>

      <h3 style="font-family:Georgia,serif;color:#4A2925;margin:20px 0 8px;">Customer Details</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;font-size:13px;"><strong>Name:</strong></td><td style="padding:6px 0;font-size:13px;">${esc(customer?.name || '')}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;"><strong>Email:</strong></td><td style="padding:6px 0;font-size:13px;">${esc(customer?.email || '')}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;"><strong>Phone:</strong></td><td style="padding:6px 0;font-size:13px;">${esc(customer?.phone || '')}</td></tr>
      </table>

      <h3 style="font-family:Georgia,serif;color:#4A2925;margin:20px 0 8px;">Delivery Address</h3>
      <p style="font-size:13px;line-height:1.6;">
        ${esc(address?.full_name || address?.fullName || '')}<br/>
        ${esc(address?.address_line1 || address?.addressLine1 || '')}<br/>
        ${address?.address_line2 || address?.addressLine2 ? esc(address?.address_line2 || address?.addressLine2) + '<br/>' : ''}
        ${esc(address?.city || '')}, ${esc(address?.state || '')} ${esc(address?.postal_code || address?.postalCode || '')}<br/>
        ${esc(address?.country || 'India')}<br/>
        Phone: ${esc(address?.phone_number || address?.phoneNumber || '')}
      </p>

      <h3 style="font-family:Georgia,serif;color:#4A2925;margin:20px 0 8px;">Product Details</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <th style="${th}">Product</th>
          <th style="${th}">Qty</th>
          <th style="${th}">Size</th>
          <th style="${th}">Unit Price</th>
          <th style="${th}">Line Total</th>
          <th style="${th}">Manufacturer</th>
        </tr>
        ${itemsHtml}
      </table>

      <h3 style="font-family:Georgia,serif;color:#4A2925;margin:20px 0 8px;">Order Summary</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;font-size:13px;">Subtotal:</td><td style="padding:6px 0;font-size:13px;text-align:right;">${inr(subtotal)}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;">Delivery Fee:</td><td style="padding:6px 0;font-size:13px;text-align:right;">${inr(deliveryFee)}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;">Discount:</td><td style="padding:6px 0;font-size:13px;text-align:right;">${inr(discountAmount)}</td></tr>
        <tr><td style="padding:10px 0;font-size:14px;font-weight:bold;border-top:2px solid #EDE5D5;">Total Amount:</td><td style="padding:10px 0;font-size:14px;font-weight:bold;text-align:right;border-top:2px solid #EDE5D5;">${inr(totalAmount)}</td></tr>
      </table>

      <hr style="border:0;border-top:1px solid #EDE5D5;margin:20px 0;" />
      <p style="font-size:11px;color:#8C7A6B;text-align:center;">Khushi's Zone © 2026</p>
    </div>
    `;

    const info = await activeTransporter.sendMail({
      from: '"Khushi\'s Zone Orders" <noreply@khushizone.com>',
      to,
      subject: `New Order - ${orderNumber} - ${inr(totalAmount)}`,
      html: htmlContent,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`📧 Order notification preview URL: ${previewUrl}`);
    console.log(`📧 Order notification sent for ${orderNumber}`);
  } catch (err) {
    console.error("❌ Failed to send order notification:", err.message);
  }
}

module.exports.sendOrderNotificationEmail = sendOrderNotificationEmail;
