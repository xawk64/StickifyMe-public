const mongoose = require("mongoose");

const Profile = mongoose.model(
  "Profile",
  new mongoose.Schema(
    {
      fullName: String,
      avatarUrl: String,
      chatId: Number,
    },
    { timestamps: true }
  )
);

module.exports = Profile;
