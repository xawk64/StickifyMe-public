import React from "react";
import Layout from "../components/Layout/Layout";
import Image from "next/image";
import firstBackgroundLanding from "../assets/first-background-landing.png";
import styles from "./index.module.scss";
import Button from "../components/ui/Button";
import telegramLogo from "../assets/telegram-logo.png";

const Landing: React.FC = () => {
  return (
    <Layout
      headerClassName={styles.layoutHeader}
      contentClassName={styles.layoutContent}
      menuItems={[
        {
          label: "НАПИСАТЬ НАМ",
          href: "https://t.me/print_etiketok",
          iconHref: telegramLogo,
          target: "_blank",
        },
      ]}
      menuClassName={styles.layoutMenu}
    >
      <div className={styles.container}>
        <Image
          src={firstBackgroundLanding}
          alt="firstBackgroundLanding"
          width={1920}
          height={924}
          className={styles.background}
        />
        <div className={styles.tryButton}>
          <p>
            ПЕЧАТЬ ЭТИКЕТОК ДЛЯ <br></br> ПРОДАВЦОВ WB В ОДНОМ МЕСТЕ!
          </p>
          <Button label="ПОПРОБОВАТЬ БЕСПЛАТНО" size="lg" href="/auth" />
        </div>
      </div>
    </Layout>
  );
};

export default Landing;
