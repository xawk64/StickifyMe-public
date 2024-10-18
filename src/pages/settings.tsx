import React, { useMemo } from "react";
import Layout from "../components/Layout/Layout";
import dynamic from "next/dynamic";
import { TelegramBot } from "../components/Settings/TelegramBot";
import UserSettings from "../components/Settings/UserSettings";
import TryButton from "../components/ui/TryButton";

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
      <UserSettings />
      {/* <TelegramBot /> */}
      {/* <WarehousesMonitoring /> */}
      <TryButton onClick={() => {}} />
    </Layout>
  );
};

export default Settings;
