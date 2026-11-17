import React, { useEffect } from "react";
import Head from "next/head";
import { AppProps } from "next/dist/shared/lib/router/router";
import { Store, StoreProvider } from "../store";
import { injectStores } from "@mobx-devtools/tools";
import "./index.css";
import AuthMe from "../components/AuthMe/AuthMe";
import { NextUIProvider } from "@nextui-org/react";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SITE_URL } from "../config/env";

const store = new Store();

const MyApp = ({ Component, pageProps }: AppProps): JSX.Element => {
  useEffect(() => {
    injectStores({ store });
  }, []);

  const router = useRouter();

  return (
    <StoreProvider store={store}>
      <NextUIProvider navigate={router.push}>
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Stickify",
                url: SITE_URL,
                description:
                  "Сервис для генерации этикеток Wildberries для печати. Импорт заказов, удобная сортировка, генерация штрих-кодов с информацией о товаре, поддержка термопринтера и формата А4. Мониторинг коэффициентов приемки складов Wildberries.",
              }),
            }}
          />
          <title>
            StickifyMe - генерация этикеток (баркодов) для продавцов WB, в одном
            месте бесплатно! Мониторинг коэффициентов приемки складов
            Wildberries.
          </title>
          <meta
            name="description"
            content="Сервис для генерации этикеток (баркодов) Wildberries для печати. Импорт заказов, удобная сортировка, генерация штрих-кодов с информацией о товаре, поддержка термопринтера и формата А4. Мониторинг коэффициентов приемки складов Wildberries."
          />
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={`${SITE_URL}/`} />
          <meta
            property="og:title"
            content="StickifyMe - Генерация этикеток (баркодов) для продавцов WB бесплатно. Мониторинг коэффициентов приемки складов Wildberries."
          />
          <meta
            property="og:description"
            content="Сервис для генерации этикеток (баркодов) Wildberries для печати. Импорт заказов, удобная сортировка, генерация штрих-кодов с информацией о товаре. Бесплатно. Мониторинг коэффициентов приемки складов Wildberries."
          />
          <meta property="og:image" content="/og-image.jpg" />
          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content={`${SITE_URL}/`} />
          <meta
            property="twitter:title"
            content="StickifyMe - Генерация этикеток (баркодов) для продавцов WB бесплатно. Мониторинг коэффициентов приемки складов Wildberries."
          />
          <meta
            property="twitter:description"
            content="Сервис для генерации этикеток (баркодов) Wildberries для печати. Импорт заказов, удобная сортировка, генерация штрих-кодов с информацией о товаре."
          />
          <meta property="twitter:image" content="/og-image.jpg" />
          <meta name="author" content="StickifyMe" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href={`${SITE_URL}/`} />
          <link rel="icon" type="image/png" href="/favicon.png" />
        </Head>
        <AuthMe />
        <Component {...pageProps} />
        <ToastContainer position="bottom-left" />
      </NextUIProvider>
    </StoreProvider>
  );
};

export default MyApp;
