const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      username: String,
      email: String,
      password: String,
      profileId: String,
      subscriptionId: String,
      emailVerification: Boolean,
      emailVerificationHash: String,
    },
    { timestamps: true }
  )
);

module.exports = User;
