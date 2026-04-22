const vt = require("../modules/virustotal");
const { parseStats, buildResultMessage } = require("../modules/formatter");
const Scan = require("../models/Scan");
const User = require("../models/User");
const config = require("../config");

const URL_REGEX = /^https?:\/\//i;
const IP_REGEX  = /^(\d{1,3}\.){3}\d{1,3}$/;
const HASH_REGEX = /^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i;
// simple domain check - has a dot, not a url, not an ip
const DOMAIN_REGEX = /^[a-z0-9][a-z0-9\-\.]+\.[a-z]{2,}$/i;

module.exports = function scanHandler(bot) {
  // /scan command
  bot.command("scan", async (ctx) => {
    const input = ctx.message.text.replace(/^\/scan\s*/i, "").trim();
    if (!input) {
      return ctx.reply("usage: /scan <url or hash>\nexample: /scan https://example.com");
    }
    await handleScan(ctx, input);
  });

  // plain text messages - auto-detect type
  bot.on("text", async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return; // skip unknown commands
    await handleScan(ctx, text);
  });
};

async function handleScan(ctx, input) {
  const telegramId = ctx.from.id;

  let type;
  if (URL_REGEX.test(input)) {
    type = "url";
  } else if (IP_REGEX.test(input)) {
    type = "ip";
  } else if (HASH_REGEX.test(input)) {
    type = "hash";
  } else if (DOMAIN_REGEX.test(input)) {
    type = "domain";
  } else {
    return ctx.reply(
      "could not identify input type.\n" +
      "please send a url, ip address, domain, md5/sha1/sha256 hash, or a file."
    );
  }

  const waitMsg = await ctx.reply(`scanning ${type}: ${truncate(input, 50)}\nplease wait...`);

  const scanRecord = await Scan.create({
    telegramId,
    type,
    input,
    status: "pending",
  });

  try {
    let stats, guiLink, sha256;

    if (type === "url") {
      const analysis = await vt.scanUrl(input);
      const analysisId = analysis.id;
      scanRecord.analysisId = analysisId;
      await scanRecord.save();

      const finalAnalysis = await vt.pollAnalysis(analysisId);
      if (!finalAnalysis) {
        throw new Error("scan timed out - try again later");
      }
      stats = parseStats(finalAnalysis.attributes);
      // try to get the url id for gui link
      const urlData = await vt.getUrlReport(input).catch(() => null);
      if (urlData) {
        guiLink = `${config.VT_GUI_URL}/url/${urlData.id}`;
      }
    } else if (type === "hash") {
      const report = await vt.getFileReport(input);
      stats = parseStats(report.attributes);
      sha256 = report.attributes.sha256;
      guiLink = `${config.VT_GUI_URL}/file/${sha256}/detection`;
    } else if (type === "ip") {
      const report = await vt.getIpReport(input);
      stats = parseStats(report.attributes);
      guiLink = `${config.VT_GUI_URL}/ip-address/${input}/detection`;
    } else if (type === "domain") {
      const report = await vt.getDomainReport(input);
      stats = parseStats(report.attributes);
      guiLink = `${config.VT_GUI_URL}/domain/${input}/detection`;
    }

    scanRecord.status = "completed";
    scanRecord.result = {
      ...stats,
      sha256: sha256 || null,
      guiLink: guiLink || null,
    };
    await scanRecord.save();

    await User.findOneAndUpdate(
      { telegramId },
      { $inc: { totalScans: 1 }, lastSeenAt: new Date() }
    );

    const msg = buildResultMessage(type, input, stats, guiLink);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      waitMsg.message_id,
      null,
      msg
    );
  } catch (err) {
    scanRecord.status = "failed";
    scanRecord.errorMessage = err.message;
    await scanRecord.save();

    const errText = err.response?.status === 404
      ? "not found in virustotal database."
      : err.response?.status === 429
      ? "api rate limit reached. please wait and try again."
      : `scan failed: ${err.message}`;

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      waitMsg.message_id,
      null,
      `error scanning ${type}.\n${errText}`
    );
  }
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}
