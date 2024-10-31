const YooKassa = require("yookassa");
const db = require("../models");
const SubscriptionPlan = db.subscriptionPlan;
const UserSubscription = db.userSubscription;

const yooKassa = new YooKassa({
  shopId: process.env.YOKASSA_SHOP_ID,
  secretKey: process.env.YOKASSA_SECRET_KEY,
});

class PaymentService {
  // Создание платежа
  static async createPayment(userId, planId) {
    try {
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        throw new Error("План подписки не найден");
      }

      const payment = await yooKassa.createPayment({
        amount: {
          value: plan.totalPrice.toFixed(2),
          currency: "RUB",
        },
        confirmation: {
          type: "redirect",
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
        },
        metadata: {
          userId,
          planId: plan._id.toString(),
        },
        capture: true,
        description: `Подписка на сервис StickifyMe (${plan.type}, ${plan.monthsCount} мес.)`,
      });

      return payment;
    } catch (error) {
      console.error("Ошибка создания платежа:", error);
      throw error;
    }
  }

  // Обработка webhook от платежной системы
  static async handlePaymentWebhook(event) {
    try {
      const payment = event.object;

      // Проверяем подпись webhook'а
      if (!this.verifyWebhookSignature(event)) {
        throw new Error("Invalid webhook signature");
      }

      if (payment.status === "succeeded") {
        const { userId, planId } = payment.metadata;
        await this.createSubscriptionAfterPayment(userId, planId);
      }
    } catch (error) {
      console.error("Ошибка обработки webhook:", error);
      throw error;
    }
  }

  // Создание подписки после успешной оплаты
  static async createSubscriptionAfterPayment(userId, planId) {
    const session = await db.mongoose.startSession();
    session.startTransaction();

    try {
      const plan = await SubscriptionPlan.findById(planId).session(session);
      if (!plan) {
        throw new Error("План подписки не найден");
      }

      // Проверяем, нет ли уже активной подписки этого типа
      const existingSubscription = await UserSubscription.findOne({
        userId,
        type: plan.type,
        isActive: true,
        endDate: { $gt: new Date() },
      }).session(session);

      let startDate = new Date();
      let endDate = new Date();

      if (existingSubscription) {
        // Если есть активная подписка, продлеваем её
        startDate = existingSubscription.endDate;
        endDate = new Date(startDate);
      }

      // Устанавливаем дату окончания
      endDate.setMonth(endDate.getMonth() + plan.monthsCount);

      const subscription = new UserSubscription({
        userId,
        planId,
        type: plan.type,
        startDate,
        endDate,
        isActive: true,
      });

      await subscription.save({ session });
      await session.commitTransaction();

      return subscription;
    } catch (error) {
      await session.abortTransaction();
      console.error("Ошибка создания подписки:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Проверка подписи webhook
  static verifyWebhookSignature(event) {
    // Реализация проверки подписи в зависимости от платежной системы
    return true; // Заглушка
  }
}

module.exports = PaymentService;
