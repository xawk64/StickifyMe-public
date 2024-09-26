import { useRouter } from "next/router";
import React from "react";
import Home from ".";

const ViewHistory: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  return <Home tabHref="История импортов" viewHistoryId={id && String(id)} />;
};

export default ViewHistory;
