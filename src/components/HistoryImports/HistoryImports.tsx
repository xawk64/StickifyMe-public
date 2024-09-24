import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import barcodesAPI from "../../api/barcodesAPI";
import { GenerateBarcodeMode } from "../../api/models/GenerateBarcodesParamsType";
import { IGetHistoryResponse } from "../../api/models/GetHistoryResponseType";
import { useStore } from "../../store";
import Table from "../ui/Table/Table";
import styles from "./HistoryImports.module.scss";

const HistoryImports: React.FC = () => {
  const {
    authStore: {
      state: { accessToken },
    },
  } = useStore();

  const router = useRouter();

  const [columns, setColumns] = useState([
    "№",
    "Количество заказов",
    "Со знаком EAC",
    "Тип печати",
    "Дата создания",
  ]);

  const [rows, setRows] = useState<string[][]>([]);

  const [result, setResult] = useState<IGetHistoryResponse[]>([]);

  useEffect(() => {
    if (accessToken) {
      (async () => {
        const result = await barcodesAPI.loadBarcodesHistory({
          page: 1,
          limit: 3000,
        });
        setResult(result.items);
        setRows(
          result.items.map((item, i) => [
            String(i + 1),
            String(item.ordersCount),
            item.withEAC ? "да" : "нет",
            item.mode === GenerateBarcodeMode.a4 ? "A4" : "Термопринтер",
            format(new Date(item.createdAt), "dd-MM-yyyy HH:mm"),
          ])
        );
      })();
    }
  }, [accessToken]);

  const onRowClick = (index: number) => {
    router.push(`/view-history?id=${result[index]._id}`);
  };

  return accessToken ? (
    <div className={styles.table}>
      <Table
        rows={rows}
        columns={columns}
        gridTemplateColumns="50px 150px 200px 200px 1fr"
        onRowClick={onRowClick}
      />
    </div>
  ) : (
    <h4>
      <Link href="/auth">Зарегистрируйтесь</Link> или{" "}
      <Link href="/auth">войдите</Link>, чтобы видеть историю импортов
    </h4>
  );
};

export default HistoryImports;
