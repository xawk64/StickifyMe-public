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
          <title>StickifyMe</title>
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
