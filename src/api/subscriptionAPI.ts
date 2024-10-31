import {
  ISubscriptionPlan,
  IUserSubscription,
} from "./models/SubscriptionType";

const subscriptionAPI = {
  getUserSubscriptions: async (
    userId: string
  ): Promise<IUserSubscription[]> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.json();
  },

  createSubscription: async (
    userId: string,
    planId: string
  ): Promise<IUserSubscription> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, planId }),
      }
    );
    return response.json();
  },

  getAvailablePlans: async (): Promise<ISubscriptionPlan[]> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/plans`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.json();
  },
};

export default subscriptionAPI;
