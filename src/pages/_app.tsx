import React, { useEffect } from "react";
import Head from "next/head";
import { AppProps } from "next/dist/shared/lib/router/router";
import { Store, StoreProvider } from "../store";
import { injectStores } from "@mobx-devtools/tools";
import "./index.css";
import authAPI from "../api/authAPI";
import AuthMe from "../components/AuthMe/AuthMe";
import { NextUIProvider } from "@nextui-org/react";

const store = new Store();

const MyApp = ({ Component, pageProps }: AppProps): JSX.Element => {
  useEffect(() => {
    injectStores({ store });
  }, []);

  return (
    <StoreProvider store={store}>
      <NextUIProvider>
        <Head>
          <title>StickifyMe</title>
        </Head>
        <AuthMe />
        <Component {...pageProps} />
      </NextUIProvider>
    </StoreProvider>
  );
};

export default MyApp;
