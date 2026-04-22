const axios = require("axios");
const vt = require("../modules/virustotal");
const { parseStats, buildResultMessage } = require("../modules/formatter");
const Scan = require("../models/Scan");
const User = require("../models/User");
const config = require("../config");

const ALLOWED_TYPES = ["document", "audio", "video", "photo", "sticker", "animation", "voice"];

module.exports = function fileHandler(bot) {
  bot.on(ALLOWED_TYPES, async (ctx) => {
    const telegramId = ctx.from.id;

    // get file info
    let fileId, filename;
    const msg = ctx.message;

    if (msg.document) {
      fileId = msg.document.file_id;
      filename = msg.document.file_name || "file";
    } else if (msg.audio) {
      fileId = msg.audio.file_id;
      filename = msg.audio.file_name || "audio";
    } else if (msg.video) {
      fileId = msg.video.file_id;
      filename = msg.video.file_name || "video";
    } else if (msg.photo) {
      // use highest resolution photo
      const photos = msg.photo;
      fileId = photos[photos.length - 1].file_id;
      filename = "photo.jpg";
    } else if (msg.voice) {
      fileId = msg.voice.file_id;
      filename = "voice.ogg";
    } else if (msg.sticker) {
      fileId = msg.sticker.file_id;
      filename = `sticker.${msg.sticker.is_animated ? "tgs" : "webp"}`;
    } else if (msg.animation) {
      fileId = msg.animation.file_id;
      filename = msg.animation.file_name || "animation.mp4";
    } else {
      return ctx.reply("unsupported file type.");
    }

    const waitMsg = await ctx.reply(`received file: ${filename}\ndownloading and scanning...`);

    const scanRecord = await Scan.create({
      telegramId,
      type: "file",
      input: filename,
      status: "pending",
    });

    try {
      // get file url from telegram
      const fileInfo = await ctx.telegram.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${fileInfo.file_path}`;

      // download file buffer
      const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data);

      if (buffer.length > 650 * 1024 * 1024) { // 650mb absolute max
        throw new Error("file is too large to scan (max 650mb)");
      }

      // upload to virustotal
      const analysis = await vt.scanFile(buffer, filename);
      const analysisId = analysis.id;
      scanRecord.analysisId = analysisId;
      await scanRecord.save();

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        waitMsg.message_id,
        null,
        `file uploaded to virustotal.\nwaiting for scan to complete...`
      );

      const finalAnalysis = await vt.pollAnalysis(analysisId);
      if (!finalAnalysis) {
        throw new Error("scan timed out - try again later");
      }

      const stats = parseStats(finalAnalysis.attributes);

      // try to get sha256 for gui link
      const sha256 = finalAnalysis.meta?.file_info?.sha256 || null;
      const guiLink = sha256 ? `${config.VT_GUI_URL}/file/${sha256}/detection` : null;

      scanRecord.status = "completed";
      scanRecord.result = {
        ...stats,
        sha256,
        guiLink,
      };
      await scanRecord.save();

      await User.findOneAndUpdate(
        { telegramId },
        { $inc: { totalScans: 1 }, lastSeenAt: new Date() }
      );

      const resultMsg = buildResultMessage("file", filename, stats, guiLink);
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        waitMsg.message_id,
        null,
        resultMsg
      );
    } catch (err) {
      scanRecord.status = "failed";
      scanRecord.errorMessage = err.message;
      await scanRecord.save();

      const errText = err.response?.status === 429
        ? "api rate limit reached. please wait and try again."
        : `scan failed: ${err.message}`;

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        waitMsg.message_id,
        null,
        `error scanning file ${filename}.\n${errText}`
      );
    }
  });
};
