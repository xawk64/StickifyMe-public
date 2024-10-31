import React, { useEffect, useState } from "react";
import { ISubscriptionPlan } from "../../../api/models/SubscriptionType";
import subscriptionAPI from "../../../api/subscriptionAPI";
import Button from "../../ui/Button";
import { toast } from "react-toastify";
import styles from "./SubscriptionPlans.module.scss";
import PaySubscription from "../PaySubscription";

const SubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await subscriptionAPI.getAvailablePlans();
      setPlans(data);
    } catch (error) {
      toast.error("Ошибка при загрузке планов подписки");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setSelectedPlan(planId);
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const payment = await response.json();
      window.location.href = payment.confirmation.confirmation_url;
    } catch (error) {
      toast.error("Ошибка при создании платежа");
    } finally {
      setSelectedPlan(null);
    }
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className={styles.plans}>
      {plans.map((plan) => (
        <PaySubscription
          key={plan.id}
          plan={plan}
          onSubscribe={handleSubscribe}
          disabled={!!selectedPlan}
        />
      ))}
    </div>
  );
};

export default SubscriptionPlans;
