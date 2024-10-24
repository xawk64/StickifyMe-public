import React, { useEffect, useMemo } from "react";
import Layout from "../components/Layout/Layout";
import dynamic from "next/dynamic";
import { TelegramBot } from "../components/Settings/TelegramBot";
import { useStore } from "../store";
import { observer } from "mobx-react-lite";
import authAPI from "../api/authAPI";

const Settings: React.FC = observer(() => {
  const WarehousesMonitoring = useMemo(
    () =>
      dynamic(() => import("../components/Settings/WarehousesMonitoring"), {
        loading: () => <p>A map is loading</p>,
        ssr: false,
      }),
    []
  );

  const {
    authStore: {
      setAuthState,

      state: { chatId },
    },
  } = useStore();
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const interval = setInterval(() => {
      if (!chatId && token) {
        (async () => {
          const userData = await authAPI.loadAuthMe();
          setAuthState({ ...userData, accessToken: token });
        })();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [chatId]);

  return (
    <Layout>
      {!chatId && <TelegramBot />}
      {chatId && <WarehousesMonitoring />}
    </Layout>
  );
});

export default Settings;
