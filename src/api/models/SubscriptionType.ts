export enum MarketplaceType {
  WILDBERRIES = "wildberries",
  OZON = "ozon",
  YANDEX_MARKET = "yandexMarket",
}

export interface ISubscriptionPlan {
  id: string;
  type: MarketplaceType;
  monthsCount: number;
  pricePerMonth: number;
  discount: number;
  totalPrice: number;
}

export interface IUserSubscription {
  id: string;
  userId: string;
  planId: string;
  type: MarketplaceType;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}
