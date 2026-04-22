module.exports = function helpHandler(bot) {
  bot.help(async (ctx) => {
    await ctx.reply(
      `\u2500\u2500 virustotal bot help \u2500\u2500\n\n` +
      `what can i scan?\n` +
      `  \u25aa url      - scan a website or link\n` +
      `  \u25aa file     - upload any file (max 32mb on free api)\n` +
      `  \u25aa ip       - check an ip address reputation\n` +
      `  \u25aa domain   - check a domain reputation\n` +
      `  \u25aa hash     - lookup md5/sha1/sha256 hash report\n\n` +
      `commands:\n` +
      `  /start            - welcome message\n` +
      `  /scan <input>     - scan a url or lookup a hash\n` +
      `  /history          - show last 10 scans\n` +
      `  /help             - show this message\n\n` +
      `powered by virustotal api v3`
    );
  });
};
