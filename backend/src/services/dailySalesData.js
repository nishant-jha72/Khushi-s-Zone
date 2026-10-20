// jobs/dailySalesJob.js
const cron = require("node-cron");
const { getDailySalesData } = require("../models/item.model"); // adjust path
const { sendDailySalesReportEmail } = require("../services/emailService"); // adjust path

async function runDailySalesReport(date) {
  try {
    const data = await getDailySalesData(date); // date optional, defaults to today (IST)
    await sendDailySalesReportEmail(data);
  } catch (err) {
    console.error("❌ Daily sales report job failed:", err.message);
  }
}

// Every day at 22:00 IST (independent of the server's timezone)
function startDailySalesReportJob() {
  cron.schedule("0 20 * * *", () => runDailySalesReport(), {
    timezone: "Asia/Kolkata",
  });
  console.log("⏰ Daily sales report scheduled for 10:00 PM IST");
}

module.exports = { runDailySalesReport, startDailySalesReportJob };
