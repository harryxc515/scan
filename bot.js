const { Telegraf } = require("telegraf");
const mongoose = require("mongoose");
const express = require("express");
const config = require("./config");
const connectDB = require("./modules/database");
const registerHandlers = require("./handlers");

const app = express();
const bot = new Telegraf(config.BOT_TOKEN);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("virustotal telegram bot is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

async function start() {
  await connectDB();
  registerHandlers(bot);

  if (config.NODE_ENV === "production" && config.WEBHOOK_URL) {
    const webhookPath = `/webhook/${config.BOT_TOKEN}`;
    app.use(bot.webhookCallback(webhookPath));
    await bot.telegram.setWebhook(`${config.WEBHOOK_URL}${webhookPath}`);
    console.log("webhook set:", `${config.WEBHOOK_URL}${webhookPath}`);
  } else {
    await bot.telegram.deleteWebhook();
    bot.launch();
    console.log("bot started in polling mode");
  }

  app.listen(config.PORT, () => {
    console.log(`server listening on port ${config.PORT}`);
  });
}

start().catch((err) => {
  console.error("failed to start bot:", err);
  process.exit(1);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
