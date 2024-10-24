import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import barcodesAPI from "../../api/barcodesAPI";
import { ImportBarcodeMode } from "../../api/models/GenerateBarcodesParamsType";
import { IGetHistoryResponse } from "../../api/models/GetHistoryResponseType";
import { useStore } from "../../store";
import Table from "../ui/Table";
import styles from "./HistoryImports.module.scss";
import { observer } from "mobx-react-lite";

const HistoryImports: React.FC = observer(() => {
  const {
    authStore: {
      state: { id: userId },
    },
  } = useStore();

  const router = useRouter();

  const [columns, setColumns] = useState([
    "№",
    "Количество заказов",
    "Тип импорта",
    "Дата создания",
  ]);

  const [rows, setRows] = useState<string[][]>([]);

  const [result, setResult] = useState<IGetHistoryResponse[]>([]);

  useEffect(() => {
    if (userId) {
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
            item.type === ImportBarcodeMode.excel
              ? "Из файла эксель"
              : item.type === ImportBarcodeMode.wb
              ? "Из Wildberries"
              : "Неизвестно",
            format(new Date(item.createdAt), "dd-MM-yyyy HH:mm"),
          ])
        );
      })();
    }
  }, [userId]);

  const onRowClick = (index: number) => {
    router.push(`/view-history?id=${result[index]._id}`);
  };

  return userId ? (
    <div className={styles.table}>
      <Table
        rows={rows}
        columns={columns}
        gridTemplateColumns="50px 150px 200px  1fr"
        onRowClick={onRowClick}
      />
    </div>
  ) : (
    <h4>
      <Link href="/auth">Зарегистрируйтесь</Link> или{" "}
      <Link href="/auth">войдите</Link>, чтобы видеть историю импортов
    </h4>
  );
});

export default HistoryImports;
