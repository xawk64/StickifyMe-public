import React, { useEffect, useState } from "react";
import { IUserSubscription } from "../../../api/models/SubscriptionType";
import subscriptionAPI from "../../../api/subscriptionAPI";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import styles from "./ActiveSubscriptions.module.scss";
import { toast } from "react-toastify";
import { useStore } from "../../../store";

const marketplaceNames = {
  wildberries: "Wildberries",
  ozon: "Ozon",
  yandexMarket: "Яндекс.Маркет",
};

const ActiveSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<IUserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { authStore } = useStore();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const data = await subscriptionAPI.getUserSubscriptions(
        authStore.state.id
      );
      setSubscriptions(data);
    } catch (error) {
      toast.error("Ошибка при загрузке активных подписок");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (subscriptions.length === 0) {
    return <div className={styles.empty}>У вас пока нет активных подписок</div>;
  }

  return (
    <div className={styles.subscriptions}>
      {subscriptions.map((sub) => (
        <div key={sub.id} className={styles.card}>
          <div className={styles.marketplace}>{marketplaceNames[sub.type]}</div>
          <div className={styles.dates}>
            <div>
              Начало:{" "}
              {format(new Date(sub.startDate), "d MMMM yyyy", { locale: ru })}
            </div>
            <div>
              Окончание:{" "}
              {format(new Date(sub.endDate), "d MMMM yyyy", { locale: ru })}
            </div>
          </div>
          <div className={styles.status}>
            {sub.isActive ? "Активна" : "Неактивна"}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActiveSubscriptions;
