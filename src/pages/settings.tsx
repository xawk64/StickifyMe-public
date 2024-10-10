import React, { useMemo } from "react";
import Layout from "../components/Layout/Layout";
import dynamic from "next/dynamic";
import { TelegramBot } from "../components/Settings/TelegramBot";

const Settings: React.FC = () => {
  const WarehousesMonitoring = useMemo(
    () =>
      dynamic(() => import("../components/Settings/WarehousesMonitoring"), {
        loading: () => <p>A map is loading</p>,
        ssr: false,
      }),
    []
  );
  return (
    <Layout>
      <TelegramBot />
      <WarehousesMonitoring />
    </Layout>
  );
};

export default Settings;
