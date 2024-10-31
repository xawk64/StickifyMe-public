const db = require("../models");
const SubscriptionPlan = db.subscriptionPlan;

const calculatePrice = (basePrice, months) => {
  let discount = 0;
  if (months >= 12) discount = 0.3; // 30% скидка
  else if (months >= 6) discount = 0.15; // 15% скидка

  const monthlyPrice = basePrice * (1 - discount);
  return Math.round(monthlyPrice * months);
};

const initializeSubscriptionPlans = async () => {
  try {
    const BASE_PRICE = 400;
    const marketplaceTypes = ["wildberries", "ozon", "yandexMarket"];
    const durations = [1, 3, 6, 12];

    const plans = [];

    for (const type of marketplaceTypes) {
      for (const months of durations) {
        plans.push({
          type,
          monthsCount: months,
          pricePerMonth: BASE_PRICE,
          discount: months >= 12 ? 30 : months >= 6 ? 15 : 0,
          totalPrice: calculatePrice(BASE_PRICE, months),
        });
      }
    }

    // Используем updateMany для каждого плана
    await Promise.all(
      plans.map((plan) =>
        SubscriptionPlan.updateOne(
          {
            type: plan.type,
            monthsCount: plan.monthsCount,
          },
          plan,
          { upsert: true }
        )
      )
    );

    console.log("Планы подписок успешно инициализированы");
  } catch (error) {
    console.error("Ошибка при инициализации планов подписок:", error);
  }
};

module.exports = {
  initializeSubscriptionPlans,
};
