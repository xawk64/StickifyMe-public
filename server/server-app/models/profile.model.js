const mongoose = require("mongoose");

const Profile = mongoose.model(
  "Profile",
  new mongoose.Schema(
    {
      fullName: String,
      avatarUrl: String,
      chatId: Number,
      wbApiKey: String,
      // one-time token for the Telegram deep link, stored as a SHA-256 hash
      telegramLinkTokenHash: { type: String, index: true },
      telegramLinkTokenExpires: Date,
    },
    { timestamps: true },
  ),
);

module.exports = Profile;
