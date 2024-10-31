const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["wildberries", "ozon", "yandexMarket"],
    required: true,
  },
  monthsCount: {
    type: Number,
    required: true,
  },
  pricePerMonth: {
    type: Number,
    required: true,
    default: 400,
  },
  discount: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
});

const UserSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
    required: true,
  },
  type: {
    type: String,
    enum: ["wildberries", "ozon", "yandexMarket"],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = {
  SubscriptionPlan: mongoose.model("SubscriptionPlan", SubscriptionPlanSchema),
  UserSubscription: mongoose.model("UserSubscription", UserSubscriptionSchema),
};
