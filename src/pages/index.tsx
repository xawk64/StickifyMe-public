import style from "./index.module.scss";
import { useStore } from "../store";
import { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import * as XLSX from "xlsx";
import Button from "../components/ui/Button/Button";
import { useRouter } from "next/router";
import barcodesAPI from "../api/barcodesAPI";
import Table from "../components/ui/Table/Table";
import { GenerateBarcodeMode } from "../api/models/GenerateBarcodesParamsType";
import RadioGroup from "../components/ui/RadioGroup/RadioGroup";
import Checkbox from "../components/ui/Checkbox/Checkbox";
import authAPI from "../api/authAPI";
import { RequestStatus } from "../store/enums";
import Tabs from "../components/ui/Tabs/Tabs";
import HistoryImports from "../components/HistoryImports/HistoryImports";
import wbAPI from "../api/wbAPI";
import { format } from "date-fns";
import { IOrder } from "../api/models/OrderType";

const modeItems = [
  { label: "Печать A4", value: GenerateBarcodeMode.a4 as string },
  { label: "Термопринтер", value: GenerateBarcodeMode.thermo as string },
];

interface IComponentProps {
  tabHref?: string;
  viewHistoryId?: string;
}

const gridTemplateColumns =
  "30px 80px 50px 50px 60px 90px  95px 350px 80px 200px 1fr 1fr 1fr 1fr 100px 100px";

const tabItems = ["Новый импорт", "История импортов"];

const Home: FC<IComponentProps> = observer(({ tabHref, viewHistoryId }) => {
  const {
    authStore: {
      status,
      state: { fullName, emailVerification },
    },
  } = useStore();

  const [tab, setTab] = useState(tabHref || tabItems[0]);

  const [columns, setColumns] = useState([
    "№",
    "id заказа",
    "Кол-во",
    "ШК низ",
    "ШК верх",
    "Баркод заказа",
    "Баркод товара",
    "Название товара",
    "Артикул WB",
    "Артикул продавца",
    "Цвет",
    "Размер",
    "Производитель",
    "Страна",
    "Категория",
    "Дата создания заказа",
  ]);

  const [rows, setRows] = useState<string[][]>([]);

  const [orders, setOrders] = useState<IOrder[]>([]);

  const [mode, setMode] = useState(modeItems[0]);

  const [withEAC, setWithEAC] = useState(false);

  const router = useRouter();

  const readExcel = async (file: File) => {
    const fileReader = await new FileReader();
    fileReader.readAsArrayBuffer(file);

    fileReader.onload = (e: any) => {
      const bufferArray = e?.target.result;
      const wb = XLSX.read(bufferArray, { type: "buffer" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      const data: { [key: string]: string }[] = XLSX.utils.sheet_to_json(ws);
      setRows(
        data.map((item, i) => {
          console.log(item);

          return [
            String(i),
            "1",
            item["Баркод товара"],
            item["Артикул"],
            item["Цвет"],
            item["Размер"],
            item["Название товара"],
            item["Наименование продавца"],
          ];
        })
      );
    };
  };

  const onLoginClick = () => {
    router.push("/auth");
  };

  const onImportFromWBClick = async () => {
    const orders = await wbAPI.loadOrders();
    if (orders) {
      barcodesAPI.addBarcodesHistory({
        withEAC: true,
        mode: GenerateBarcodeMode.thermo,
        orders,
      });

      setRows(
        orders.map((order, i) => [
          `${i + 1}`,
          `${order.id}`,
          "1",
          order.bcDown,
          order.bcUp,
          order.barcode,
          order.product.barcode,
          order.product.title,
          `${order.nmId}`,
          order.product.vendorCode,
          order.product.characteristics["Цвет"]?.[0] || "",
          order.product.characteristics["Размер"]?.[0] || "",
          order.product.brand,
          order.product.characteristics["Страна производства"]?.[0] || "",
          order.product.subjectName,
          format(new Date(order.createdAtMarket), "dd-MM-yyyy HH:mm"),
        ])
      );
      setOrders(orders);
    }
  };

  const setTabHandler = (tab: string) => {
    router.push(tab === tabItems[0] ? "/" : "/history");
  };

  useEffect(() => {
    if (viewHistoryId) {
      (async () => {
        const history = await barcodesAPI.loadBarcodesHistoryById({
          id: viewHistoryId,
        });
        setRows(
          history.orders.map((order, i) => [
            `${i + 1}`,
            `${order.id}`,
            "1",
            order.bcDown,
            order.bcUp,
            order.barcode,
            order.product.barcode,
            order.product.title,
            `${order.nmId}`,
            order.product.vendorCode,
            order.product.characteristics["Цвет"]?.[0] || "",
            order.product.characteristics["Размер"]?.[0] || "",
            order.product.brand,
            order.product.characteristics["Страна производства"]?.[0] || "",
            order.product.subjectName,
            format(new Date(order.createdAtMarket), "dd-MM-yyyy HH:mm"),
          ])
        );
        setWithEAC(history.withEAC);
        setMode(
          history.mode === GenerateBarcodeMode.a4 ? modeItems[0] : modeItems[1]
        );
        setOrders(history.orders);
      })();
    }
  }, [viewHistoryId]);

  return (
    <div className="mx-6">
      <div className="flex justify-between mb-6 mt-2">
        <h4 className="font-bold">BarcodeBerries</h4>
        {status === RequestStatus.success ? (
          fullName
        ) : status === RequestStatus.pending ? null : (
          <Button label="Войти" onClick={onLoginClick} />
        )}
      </div>
      <div className="flex justify-center">
        <div className={style.container}>
          <Tabs items={tabItems} value={tab} setValue={setTabHandler} />
          {tab === tabItems[0] && (
            <>
              <div>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e?.target?.files?.length) {
                      const file = e.target?.files[0];
                      readExcel(file);
                    }
                  }}
                />
              </div>

              <Button
                onClick={onImportFromWBClick}
                label="Импорт с Wildberries"
              />

              {rows.length > 0 && (
                <>
                  <Table
                    rows={rows}
                    setRows={setRows}
                    columns={columns}
                    gridTemplateColumns={gridTemplateColumns}
                    isEditable
                  />

                  <RadioGroup
                    items={modeItems}
                    value={mode}
                    onChange={setMode}
                  />

                  <Checkbox
                    value={withEAC}
                    setValue={setWithEAC}
                    label="Знак EAC"
                  />

                  <Button
                    onClick={() =>
                      barcodesAPI.loadGenerateBarcode({
                        orders,
                        mode: mode.value as GenerateBarcodeMode,
                        withEAC,
                      })
                    }
                    label="Скачать этикетки"
                  />
                </>
              )}
            </>
          )}
          {tab === tabItems[1] && viewHistoryId && rows.length ? (
            <>
              <Table
                rows={rows}
                setRows={setRows}
                columns={columns}
                gridTemplateColumns={gridTemplateColumns}
                isEditable
              />

              <RadioGroup items={modeItems} value={mode} onChange={setMode} />

              <Checkbox
                value={withEAC}
                setValue={setWithEAC}
                label="Знак EAC"
              />

              <Button
                onClick={() =>
                  barcodesAPI.loadGenerateBarcode({
                    orders,
                    mode: mode.value as GenerateBarcodeMode,
                    withEAC,
                  })
                }
                label="Скачать этикетки"
              />
            </>
          ) : (
            tab === tabItems[1] && <HistoryImports />
          )}
        </div>
      </div>
    </div>
  );
});

export default Home;
