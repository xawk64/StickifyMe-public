import React from "react";
import Layout from "../components/Layout/Layout";
import SubscriptionPlans from "../components/Subscriptions/SubscriptionPlans/";
import ActiveSubscriptions from "../components/Subscriptions/ActiveSubscriptions";
import { observer } from "mobx-react-lite";
import styles from "./subscription.module.scss";

const SubscriptionPage: React.FC = observer(() => {
  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Подписки</h1>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Активные подписки</h2>
            <ActiveSubscriptions />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Доступные планы</h2>
            <SubscriptionPlans />
          </section>
        </div>
      </div>
    </Layout>
  );
});

export default SubscriptionPage;
