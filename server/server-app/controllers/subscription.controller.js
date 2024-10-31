const db = require("../models");
const SubscriptionPlan = db.subscriptionPlan;
const UserSubscription = db.userSubscription;

exports.getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find();
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).send({ message: "Ошибка при получении планов подписки" });
  }
};

exports.getUserSubscriptions = async (req, res) => {
  try {
    const subscriptions = await UserSubscription.find({
      userId: req.userId,
      isActive: true,
    }).populate("planId");
    res.status(200).json(subscriptions);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Ошибка при получении подписок пользователя" });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.body.planId);
    if (!plan) {
      return res.status(404).send({ message: "План подписки не найден" });
    }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.monthsCount);

    const subscription = new UserSubscription({
      userId: req.userId,
      planId: plan._id,
      type: plan.type,
      startDate: new Date(),
      endDate: endDate,
      isActive: true,
    });

    await subscription.save();
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).send({ message: "Ошибка при создании подписки" });
  }
};
