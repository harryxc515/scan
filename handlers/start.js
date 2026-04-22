const User = require("../models/User");

module.exports = function startHandler(bot) {
  bot.start(async (ctx) => {
    try {
      await User.findOrCreate(ctx.from);
    } catch (e) {
      console.error("start: db error", e.message);
    }

    const name = ctx.from.first_name || ctx.from.username || "user";

    await ctx.reply(
      `\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n` +
      `\u2502  virustotal bot          \u2502\n` +
      `\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n\n` +
      `welcome, ${name}.\n\n` +
      `send me any of the following and i will scan it using virustotal:\n\n` +
      `  \u25aa a url         e.g. https://example.com\n` +
      `  \u25aa a file        (document, photo, audio etc)\n` +
      `  \u25aa an ip address e.g. 1.2.3.4\n` +
      `  \u25aa a domain      e.g. example.com\n` +
      `  \u25aa a hash        md5 / sha1 / sha256\n\n` +
      `commands:\n` +
      `  /scan <url or hash>   - scan a url or hash\n` +
      `  /history              - view your last 10 scans\n` +
      `  /help                 - show this help\n`
    );
  });
};
