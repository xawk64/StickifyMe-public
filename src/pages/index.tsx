import React from "react";
import Layout from "../components/Layout/Layout";
import Image from "next/image";
import firstBackgroundLanding from "../assets/first-background-landing.png";
import styles from "./index.module.scss";
import Button from "../components/ui/Button";
import telegramLogo from "../assets/telegram-logo.png";
import OurAdvantages from "../components/Landing/OurAdvantages";
import Footer from "../components/Landing/Footer";
import { TELEGRAM_CHANNEL_URL } from "../config/env";

const Landing: React.FC = () => {
  return (
    <Layout
      headerClassName={styles.layoutHeader}
      contentClassName={styles.layoutContent}
      menuItems={[
        {
          label: "НАПИСАТЬ НАМ",
          href: TELEGRAM_CHANNEL_URL,
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
          loading="eager"
          style={{ objectFit: "cover" }}
        />
        <div className={styles.tryButton}>
          <p>
            ГЕНЕРАЦИЯ ЭТИКЕТОК (БАРКОДОВ) ДЛЯ <br></br> ПРОДАВЦОВ WB В ОДНОМ
            МЕСТЕ! <br></br> ОПОВЕЩЕНИЯ О БЕСПЛАТНОЙ ПРИЕМКЕ
          </p>
          <Button
            label="ПОПРОБОВАТЬ БЕСПЛАТНО"
            size="lg"
            href="/auth?type=signUp"
          />
        </div>
      </div>
      <OurAdvantages />
      {/* <Reviews /> */}
      <Footer />
    </Layout>
  );
};

export default Landing;
