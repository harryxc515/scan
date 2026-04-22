require("dotenv").config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || "",
  VT_API_KEY: process.env.VT_API_KEY || "",
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/vtbot",
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  WEBHOOK_URL: process.env.WEBHOOK_URL || "",
  VT_BASE_URL: "https://www.virustotal.com/api/v3",
  VT_GUI_URL: "https://www.virustotal.com/gui",
  MAX_FILE_SIZE: 32 * 1024 * 1024, // 32mb free tier limit
  SCAN_POLL_INTERVAL: 5000,         // 5 seconds between poll retries
  SCAN_MAX_RETRIES: 12,             // max polling attempts
};
