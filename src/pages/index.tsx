import React from "react";
import Layout from "../components/Layout/Layout";
import Image from "next/image";
import firstBackgroundLanding from "../assets/first-background-landing.png";
import styles from "./index.module.scss";
import Button from "../components/ui/Button/Button";

const Landing: React.FC = () => {
  return (
    <Layout>
      <div className={styles.container}>
        <Image
          src={firstBackgroundLanding}
          alt="firstBackgroundLanding"
          width={1920}
          height={924}
        />
        <div className={styles.tryButton}>
          <p>
            ПЕЧАТЬ ЭТИКЕТОК ДЛЯ <br></br> ПРОДАВЦОВ WB В ОДНОМ МЕСТЕ!
          </p>
          <Button label="ПОПРОБОВАТЬ БЕСПЛАТНО" onClick={() => {}} />
        </div>
      </div>
    </Layout>
  );
};

export default Landing;
