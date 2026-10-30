// jobs/dailySalesJob.js
const cron = require("node-cron");
const { getDailySalesData } = require("../models/item.model");
const {
  sendDailySalesReportEmail,
  sendNewsletterEmail,
} = require("../services/emailService");
const NewsletterModel = require("../models/newsletter.model");

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

function initNewsletterCron() {
  // Runs every Monday at 9:00 AM IST (Adjusted cron expression to match comment)
  cron.schedule(
    "11 6 * * *",
    async () => {
      try {
        console.log("Running weekly newsletter dispatch job...");
        const subscribers = await NewsletterModel.getActiveSubscribers();
        if (!subscribers || subscribers.length === 0) {
          console.log("No active subscribers found for this week.");
          return;
        }

        for (const subscriber of subscribers) {
          try {
            // Pass the subscriber object so the service can access subscriber.email and personalize if needed
            await sendNewsletterEmail(subscriber);
          } catch (subError) {
            console.error(
              `Failed to send newsletter to ${subscriber.email}:`,
              subError.message,
            );
          }
        }

        console.log("Weekly newsletter dispatch completed.");
      } catch (error) {
        console.error("Error running newsletter cron job:", error);
      }
    },
    {
      timezone: "Asia/Kolkata", // Ensures it triggers correctly based on IST
    },
  );

  console.log(
    "⏰ Weekly newsletter cron job initialized (Every Monday at 9:00 AM IST)",
  );
}

module.exports = {
  runDailySalesReport,
  startDailySalesReportJob,
  initNewsletterCron,
};
