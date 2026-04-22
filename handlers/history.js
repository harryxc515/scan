const Scan = require("../models/Scan");
const { buildHistoryMessage } = require("../modules/formatter");

module.exports = function historyHandler(bot) {
  bot.command("history", async (ctx) => {
    const telegramId = ctx.from.id;

    try {
      const scans = await Scan.find({ telegramId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const msg = buildHistoryMessage(scans);
      await ctx.reply(msg);
    } catch (err) {
      console.error("history: db error", err.message);
      await ctx.reply("could not fetch history. please try again later.");
    }
  });
};
