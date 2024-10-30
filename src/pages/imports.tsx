import { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import * as XLSX from "xlsx";
import Button from "../components/ui/Button";
import { useRouter } from "next/router";
import barcodesAPI from "../api/barcodesAPI";
import Table from "../components/ui/Table";
import {
  GenerateBarcodeMode,
  ImportBarcodeMode,
} from "../api/models/GenerateBarcodesParamsType";
import RadioGroup from "../components/ui/RadioGroup";
import Checkbox from "../components/ui/Checkbox";
import Tabs from "../components/ui/Tabs";
import HistoryImports from "../components/HistoryImports/HistoryImports";
import wbAPI from "../api/wbAPI";
import { format } from "date-fns";
import { IOrder } from "../api/models/OrderType";
import Layout from "../components/Layout/Layout";
import FilePicker from "../components/ui/FilePicker";
import { useStore } from "../store";
import { toast } from "react-toastify";
import Modal from "../components/ui/Modal";
import { ProgressBar } from "../components/ui/ProgressBar";
import { formatTime } from "../utils/helpers";

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

const tabItems = [
  { label: "Новый импорт", href: "/imports" },
  { label: "История импортов", href: "/history" },
];

function isValidDate(d: Date) {
  return d instanceof Date && !isNaN(d.getTime());
}

const Imports: FC<IComponentProps> = observer(({ tabHref, viewHistoryId }) => {
  const printDocument = useRef<(blob: Blob) => void>();

  const [tab, setTab] = useState<{ label: string; href: string }>(
    tabItems.find((tab) => tab.href === tabHref) || tabItems[0]
  );

  const {
    authStore: {
      state: { wbApiKey: token },
    },
  } = useStore();

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

  const [rows, setRows] = useState<(string | JSX.Element)[][]>([]);

  const [orders, setOrders] = useState<IOrder[]>([]);

  const [mode, setMode] = useState(modeItems[0]);

  const [importType, setImportType] = useState(ImportBarcodeMode.wb);

  const [withEAC, setWithEAC] = useState(false);
  const [withFullInfo, setWithFullInfo] = useState(false);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const router = useRouter();
  const [remainingTime, setRemainingTime] = useState(0);

  const [isInitialized, setIsInitialized] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);

  const readExcel = async (file: File) => {
    const fileReader = new FileReader();

    setImportType(ImportBarcodeMode.excel);
    fileReader.readAsArrayBuffer(file);

    fileReader.onload = async (e: any) => {
      if (!token) {
        toast.error("Не найден ключ API для Wildberries");
        return;
      }
      const bufferArray = e?.target.result;
      const wb = XLSX.read(bufferArray, { type: "buffer" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      const data: { [key: string]: string }[] = XLSX.utils.sheet_to_json(ws);

      let orders = data.map((item) => {
        const order: IOrder = {
          id: parseInt(item["№ задания"]),
          nmId: parseInt(item["Артикул Wildberries"]),
          createdAtMarket: item["Дата создания"],
          deliveryType: "",
          stickersCount: 1,
          barcodeFile: "",
          bcUp: "ШК верх",
          bcDown: "ШК низ",
          barcode: "Баркод заказа",
          product: {
            title: item["Наименование"],
            barcode: item["Стикер"],
            vendorCode: item["Артикул продавца"],
            id: 0,
            subjectName: "Категория",
            brand: "Производитель",
            description: "",
            createdAtMarket: "",
            updatedAtMarket: "",
            characteristics: {
              Цвет: [item["Цвет"]],
              Размер: [item["Размер"] === "0" ? "" : item["Размер"]],
              "Страна производства": [item["Страна"]],
            },
          },
        };
        return order;
      });

      orders = await wbAPI.loadProductsInfo(
        orders,
        withFullInfo,
        token,
        setLoadingProgress,
        setRemainingTime
      );

      if (orders.length === 0) {
        toast.error("Не найдено ни одного заказа со статусом 'В сборке'");
        return;
      }

      orders = orders.sort((a, b) => {
        if (a.product.title !== b.product.title) {
          return a.product.title.localeCompare(b.product.title);
        }
        return a.nmId - b.nmId;
      });

      barcodesAPI.addBarcodesHistory({
        type: importType,
        orders,
      });
      setRows(
        orders.map((order, i) => [
          String(i + 1),
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
          order.createdAtMarket,
        ])
      );
      setOrders(orders);
      toast.success("Заказы успешно импортированы из Wildberries!");
    };
  };

  const onImportFromWBClick = async () => {
    if (!token) {
      toast.error("Не найден ключ API для Wildberries");
      return;
    }
    setImportType(ImportBarcodeMode.wb);
    setImportInProgress(true);
    setIsLoadingModalOpen(true);
    let orders = await wbAPI.loadOrders(
      token,
      setLoadingProgress,
      setRemainingTime
    );
    orders = orders?.sort((a, b) => {
      if (a.product.title !== b.product.title) {
        return a.product.title.localeCompare(b.product.title);
      }
      return a.nmId - b.nmId;
    });
    if (orders) {
      barcodesAPI.addBarcodesHistory({
        type: importType,
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
      toast.success("Заказы успешно импортированы из Wildberries!");
    }
    setImportInProgress(false);
  };

  const setTabHandler = (tab: { label: string; href: string } | undefined) => {
    if (tab && isInitialized) {
      router.push(tab.href);
      setTab(tab);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const printJS = require("print-js");

      printDocument.current = (blob: Blob) => {
        const pdfUrl = URL.createObjectURL(blob);
        printJS({
          printable: pdfUrl,
          type: "pdf",
          documentTitle: "Документ для печати",
        });
      };
      setIsInitialized(true);
    }
  }, []);

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
            isValidDate(new Date(order.createdAtMarket))
              ? format(new Date(order.createdAtMarket), "dd-MM-yyyy HH:mm")
              : order.createdAtMarket,
          ])
        );
        setOrders(history.orders);
      })();
    }
  }, [viewHistoryId]);

  const handleFileChange = (file: File | null) => {
    if (file) readExcel(file);
  };

  return (
    <Layout>
      <div className="mx-6">
        <div className="flex justify-between mb-6"></div>
        <div className="flex justify-center ">
          <div className="flex flex-col gap-6">
            <div className="flex justify-center">
              <Tabs items={tabItems} setValue={setTabHandler} />
            </div>
            {(tab.href === tabItems[0].href ||
              (tab === tabItems[1] && viewHistoryId)) && (
              <>
                <div className="flex  gap-4 items-center justify-center">
                  <div className="flex gap-2 items-center">
                    {/* <Checkbox
                      value={withFullInfo}
                      setValue={setWithFullInfo}
                      label="Загрузить полную информацию о товарах (медленно)"
                    /> */}
                    <FilePicker onChange={handleFileChange} />
                  </div>
                  <Button
                    onClick={onImportFromWBClick}
                    label="Импорт из Wildberries"
                  />
                </div>

                {rows.length > 0 && (
                  <>
                    <Table
                      rows={rows}
                      setRows={setRows}
                      columns={columns}
                      gridTemplateColumns={gridTemplateColumns}
                      isEditable
                    />

                    <div className="flex gap-4 items-center justify-center flex-col">
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

                      <div className="flex gap-4 items-center">
                        <Button
                          onClick={() =>
                            barcodesAPI.loadGenerateBarcode(
                              {
                                orders,
                                mode: mode.value as GenerateBarcodeMode,
                                withEAC,
                              },
                              false
                            )
                          }
                          label="Скачать этикетки"
                        />
                        <Button
                          onClick={async () => {
                            const blob = await barcodesAPI.loadGenerateBarcode(
                              {
                                orders,
                                mode: mode.value as GenerateBarcodeMode,
                                withEAC,
                              },
                              true
                            );

                            if (printDocument.current)
                              printDocument.current(blob);
                          }}
                          label="Напечатать этикетки"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {tab === tabItems[1] && !viewHistoryId && <HistoryImports />}
          </div>
        </div>
      </div>
      <Modal
        isOpen={isLoadingModalOpen}
        className="w-[500px]"
        onClose={() => setIsLoadingModalOpen(false)}
        title="Импорт данных о товарах из Wildberries"
        footer={
          <div className="flex gap-4 items-center">
            <Button
              onClick={() =>
                barcodesAPI.loadGenerateBarcode(
                  {
                    orders,
                    mode: mode.value as GenerateBarcodeMode,
                    withEAC,
                  },
                  false
                )
              }
              label="Скачать этикетки"
              disabled={importInProgress}
            />
            <Button
              onClick={async () => {
                const blob = await barcodesAPI.loadGenerateBarcode(
                  {
                    orders,
                    mode: mode.value as GenerateBarcodeMode,
                    withEAC,
                  },
                  true
                );

                if (printDocument.current) printDocument.current(blob);
              }}
              label="Напечатать этикетки"
              disabled={importInProgress}
            />
          </div>
        }
      >
        {importInProgress ? (
          <>
            <p className="mb-4">
              Идет импорт данных, пожалуйста, не закрывайте это окно
            </p>
            <ProgressBar value={loadingProgress} />
            <p>
              {importInProgress
                ? remainingTime
                  ? `Осталось примерно ${formatTime(Math.round(remainingTime))}`
                  : ""
                : "Импорт успешно завершен"}
            </p>
          </>
        ) : (
          <p className="mb-4">Импорт успешно завершен</p>
        )}
      </Modal>
    </Layout>
  );
});

export default Imports;
