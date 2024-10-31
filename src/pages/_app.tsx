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
            dangerouslySetInnerHTML={{
              __html: `
              if (typeof window !== 'undefined' && !window.location.href.includes('localhost')) {
                (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

                ym(98771871, "init", {
                  clickmap: true,
                  trackLinks: true,
                  accurateTrackBounce: true,
                });
              }
            `,
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Stickify",
                url: "https://stickify.ru",
                description:
                  "Сервис для печати этикеток Wildberries. Импорт заказов, удобная сортировка, генерация штрих-кодов с информацией о товаре, поддержка термопринтера и формата А4.",
              }),
            }}
          />
          <title>
            StickifyMe - Печать этикеток для продавцов WB, в одном месте!
          </title>
          <meta
            name="google-site-verification"
            content="JhKAOXbBwexhob9oBks0P-CukqCasArynmbW7nem27E"
          />

          <meta name="yandex-verification" content="da50e1fc89f38446" />
          <meta
            name="description"
            content="Сервис для печати этикеток Wildberries. Импорт заказов, удобная сортировка, генерация штрих-кодов с информацией о товаре, поддержка термопринтера и формата А4."
          />
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://example.com/" />
          <meta
            property="og:title"
            content="StickifyMe - Печать этикеток для продавцов WB"
          />
          <meta
            property="og:description"
            content="Сервис для печати этикеток Wildberries. Импорт заказов, удобная сортировка, генерация штрих-кодов с информацией о товаре."
          />
          <meta property="og:image" content="/og-image.jpg" />
          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content="https://example.com/" />
          <meta
            property="twitter:title"
            content="StickifyMe - Печать этикеток для продавцов WB"
          />
          <meta
            property="twitter:description"
            content="Сервис для печати этикеток Wildberries. Импорт заказов, удобная сортировка, генерация штрих-кодов с информацией о товаре."
          />
          <meta property="twitter:image" content="/og-image.jpg" />
          {/* Дополнительные мета-теги */}
          <meta
            name="keywords"
            content="Wildberries, этикетки, штрих-коды, печать этикеток, WB, маркетплейс, термопринтер, мониторинг складов Wildberries, 
            мониторинг коэффициентов приемки, генерация штрихкодов, штрихкод, баркод, этикетка, FBS, бесплатно"
          />
          <meta name="author" content="StickifyMe" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href="https://example.com/" />
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
