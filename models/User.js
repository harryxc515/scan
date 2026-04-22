const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    telegramId: { type: Number, required: true, unique: true },
    username: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    language: { type: String, default: "en" },
    totalScans: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    joinedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.statics.findOrCreate = async function (telegramUser) {
  let user = await this.findOne({ telegramId: telegramUser.id });
  if (!user) {
    user = await this.create({
      telegramId: telegramUser.id,
      username: telegramUser.username || null,
      firstName: telegramUser.first_name || null,
      lastName: telegramUser.last_name || null,
    });
  } else {
    user.lastSeenAt = new Date();
    user.username = telegramUser.username || user.username;
    user.firstName = telegramUser.first_name || user.firstName;
    await user.save();
  }
  return user;
};

module.exports = mongoose.model("User", userSchema);
