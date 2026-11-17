const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      // unique indexes close the race window of the "check then insert" signup flow
      username: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      password: String,
      profileId: String,
      emailVerification: Boolean,
      emailVerificationHash: String,
      resetPasswordToken: String,
      resetPasswordExpires: Date,
    },
    { timestamps: true },
  ),
);

module.exports = User;
