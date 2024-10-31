import React, { useState } from "react";
import { ISubscriptionPlan } from "../../../api/models/SubscriptionType";
import Button from "../../ui/Button";
import { toast } from "react-toastify";
import styles from "./PaySubscription.module.scss";

interface PaySubscriptionProps {
  plan: ISubscriptionPlan;
  onSubscribe: (planId: string) => Promise<void>;
  disabled?: boolean;
}

const PaySubscription: React.FC<PaySubscriptionProps> = ({
  plan,
  onSubscribe,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    try {
      setIsProcessing(true);
      await onSubscribe(plan.id);
    } catch (error) {
      toast.error("Ошибка при оформлении подписки");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.planCard}>
      <div className={styles.marketplace}>
        {plan.type === "wildberries" && "Wildberries"}
        {plan.type === "ozon" && "Ozon"}
        {plan.type === "yandexMarket" && "Яндекс.Маркет"}
      </div>

      <div className={styles.duration}>
        {plan.monthsCount}{" "}
        {plan.monthsCount === 1
          ? "месяц"
          : plan.monthsCount < 5
          ? "месяца"
          : "месяцев"}
      </div>

      {plan.discount > 0 && (
        <div className={styles.discount}>Скидка {plan.discount}%</div>
      )}

      <div className={styles.price}>
        <div className={styles.monthly}>{plan.pricePerMonth} ₽/мес</div>
        <div className={styles.total}>Итого: {plan.totalPrice} ₽</div>
      </div>

      <Button
        onClick={handleSubscribe}
        label={isProcessing ? "Обработка..." : "Подключить"}
        disabled={disabled || isProcessing}
      />
    </div>
  );
};

export default PaySubscription;
