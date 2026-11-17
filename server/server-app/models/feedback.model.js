const mongoose = require("mongoose");

const Feedback = mongoose.model(
  "Feedback",
  new mongoose.Schema(
    {
      message: String,
      type: String,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      userEmail: String,
      status: {
        type: String,
        enum: ["new", "in_progress", "resolved"],
        default: "new",
      },
    },
    { timestamps: true },
  ),
);

module.exports = Feedback;
