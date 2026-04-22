const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    telegramId: { type: Number, required: true, index: true },
    type: {
      type: String,
      enum: ["url", "file", "hash", "ip", "domain"],
      required: true,
    },
    input: { type: String, required: true },
    analysisId: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "queued"],
      default: "pending",
    },
    result: {
      malicious: { type: Number, default: 0 },
      suspicious: { type: Number, default: 0 },
      harmless: { type: Number, default: 0 },
      undetected: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      verdict: { type: String, default: "unknown" }, // clean / suspicious / malicious / unknown
      sha256: { type: String, default: null },
      guiLink: { type: String, default: null },
    },
    errorMessage: { type: String, default: null },
    scannedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// index for fast user history lookup
scanSchema.index({ telegramId: 1, createdAt: -1 });

module.exports = mongoose.model("Scan", scanSchema);
