import { useRouter } from "next/router";
import React from "react";
import Imports from "./imports";

const ViewHistory: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  return (
    <Imports tabHref="История импортов" viewHistoryId={id && String(id)} />
  );
};

export default ViewHistory;
