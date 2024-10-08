const mongoose = require("mongoose");

const Profile = mongoose.model(
  "Profile",
  new mongoose.Schema(
    {
      fullName: String,
      avatarUrl: String,
      chatId: Number,
      wbApiKey: String,
    },
    { timestamps: true }
  )
);

module.exports = Profile;
