import {
  MarketplaceType,
  ISubscriptionPlan,
} from "../api/models/SubscriptionType";

const BASE_PRICE = 400;

export const calculateDiscount = (monthsCount: number): number => {
  if (monthsCount >= 12) return 0.3; // 30% скидка
  if (monthsCount >= 6) return 0.15; // 15% скидка
  return 0;
};

export const generateSubscriptionPlans = (): ISubscriptionPlan[] => {
  const plans: ISubscriptionPlan[] = [];
  const durations = [1, 3, 6, 12];
  const marketplaces = Object.values(MarketplaceType);

  marketplaces.forEach((marketplace) => {
    durations.forEach((months) => {
      const discount = calculateDiscount(months);
      const priceWithDiscount = BASE_PRICE * (1 - discount);

      plans.push({
        id: `${marketplace}-${months}`,
        type: marketplace,
        monthsCount: months,
        pricePerMonth: BASE_PRICE,
        discount: discount * 100,
        totalPrice: priceWithDiscount * months,
      });
    });
  });

  return plans;
};
