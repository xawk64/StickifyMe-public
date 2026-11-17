import { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
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
import importAPI, { ImportProgress } from "../api/importAPI";
import { getErrorMessage } from "../api";
import { format, set } from "date-fns";
import { IOrder } from "../api/models/OrderType";
import Layout from "../components/Layout/Layout";
import { useStore } from "../store";
import { toast } from "react-toastify";
import Modal from "../components/ui/Modal";
import { ProgressBar } from "../components/ui/ProgressBar";
import { formatTime } from "../utils/helpers";
import Loader from "../components/ui/Loader";
import Select from "../components/ui/Select";

const modeItems = [
  { label: "Термопринтер", value: GenerateBarcodeMode.thermo as string },
  { label: "Печать A4", value: GenerateBarcodeMode.a4 as string },
];

interface IComponentProps {
  tabHref?: string;
  viewHistoryId?: string;
}

const gridTemplateColumns =
  "30px 80px 50px 60px 90px  95px 350px 80px 200px 1fr 1fr 1fr 1fr 100px 100px";

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
      state: { hasWbApiKey },
    },
  } = useStore();

  const [columns, setColumns] = useState([
    "№",
    "id заказа",
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

  const [daysCountForOrders, setDaysCountForOrders] = useState(3);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const router = useRouter();
  const [remainingTime, setRemainingTime] = useState(0);

  const [generateBarcodesInProgress, setGenerateBarcodesInProgress] =
    useState(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);

  const onImportProgress = ({ done, total, remainingMs }: ImportProgress) => {
    setLoadingProgress(total ? (done / total) * 100 : 0);
    setRemainingTime(Math.round(remainingMs / 1000));
  };

  const onImportFromWBClick = async () => {
    try {
      if (!hasWbApiKey) {
        toast.error("Не найден ключ API для Wildberries");
        return;
      }
      setImportType(ImportBarcodeMode.wb);
      setImportInProgress(true);
      setIsLoadingModalOpen(true);

      let orders = await importAPI.importFromWb(daysCountForOrders, onImportProgress);

      if (!orders || orders.length === 0) {
        toast.error("Не найдено ни одного заказа со статусом 'В сборке'");
        setImportInProgress(false);
        setIsLoadingModalOpen(false);
        return;
      }

      orders = orders.sort((a, b) => {
        if (a.product.title !== b.product.title) {
          return a.product.title.localeCompare(b.product.title);
        }
        return a.nmId - b.nmId;
      });

      await barcodesAPI.addBarcodesHistory({
        type: importType,
        orders,
      });

      setRows(
        orders.map((order, i) => [
          `${i + 1}`,
          `${order.id}`,
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
      setImportInProgress(false);
      toast.success("Заказы успешно импортированы из Wildberries!");
    } catch (error) {
      console.error("Error importing from WB:", error);
      toast.error("Произошла ошибка при импорте заказов");
    } finally {
      setImportInProgress(false);
    }
  };

  const setTabHandler = (tab: { label: string; href: string } | undefined) => {
    if (tab && isInitialized) {
      router.push(tab.href);
      setTab(tab);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // print-js touches window on import, so it is loaded only in the browser
      const printJSPromise = import("print-js").then((module) => module.default);

      printDocument.current = async (blob: Blob) => {
        const printJS = await printJSPromise;
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
      setImportInProgress(true);
      (async () => {
        const history = await barcodesAPI.loadBarcodesHistoryById({
          id: viewHistoryId,
        });
        setRows(
          history.orders.map((order, i) => [
            `${i + 1}`,
            `${order.id}`,
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
        setImportInProgress(false);
      })();
    }
  }, [viewHistoryId]);

  const handlePrintClick = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      toast.info("Чтобы напечатать этикетки, зайдите на сайт с компьютера");
      return;
    }
    setIsLoadingModalOpen(false);
    setGenerateBarcodesInProgress(true);

    try {
      const blob = await barcodesAPI.loadGenerateBarcode(
        {
          orders,
          mode: mode.value as GenerateBarcodeMode,
          withEAC,
        },
        true
      );

      if (blob && printDocument.current) printDocument.current(blob);
    } catch (error) {
      console.error("Error printing barcodes:", error);
      toast.error("Произошла ошибка при печати этикеток");
    } finally {
      setGenerateBarcodesInProgress(false);
    }
  };

  const handleDownloadClick = async () => {
    setIsLoadingModalOpen(false);
    setGenerateBarcodesInProgress(true);
    try {
      await barcodesAPI.loadGenerateBarcode(
        {
          orders,
          mode: mode.value as GenerateBarcodeMode,
          withEAC,
        },
        false
      );
      setGenerateBarcodesInProgress(false);
    } catch (error) {
      console.error("Error downloading barcodes:", error);
      toast.error("Произошла ошибка при скачивании этикеток");
    } finally {
      setGenerateBarcodesInProgress(false);
    }
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
                <div className="flex flex-col gap-4 items-center justify-center">
                  <p className="flex items-center gap-2">
                    {daysCountForOrders === 1
                      ? "Выполнять импорт заказов за последний "
                      : `Выполнять импорт заказов за последние `}
                    <Select
                      initValue={daysCountForOrders.toString()}
                      onChange={(value) =>
                        setDaysCountForOrders(parseInt(value[0]))
                      }
                      items={Array.from({ length: 7 }, (_, i) => ({
                        key: `${i + 1}`,
                        label: `${i + 1}`,
                      }))}
                      placeholder="Количество дней"
                      className="w-[70px] min-w-[70px]"
                    />{" "}
                    {daysCountForOrders === 1
                      ? "день"
                      : daysCountForOrders > 4
                      ? "дней"
                      : "дня"}
                  </p>
                  <Button
                    onClick={onImportFromWBClick}
                    label="Импорт заказов из Wildberries"
                    disabled={importInProgress || generateBarcodesInProgress}
                  />
                </div>

                <Table
                  rows={rows}
                  setRows={setRows}
                  columns={columns}
                  gridTemplateColumns={gridTemplateColumns}
                  isEditable
                  isLoading={importInProgress}
                />
                {rows.length > 0 && (
                  <>
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
                          onClick={handleDownloadClick}
                          label="Скачать этикетки"
                          disabled={
                            importInProgress || generateBarcodesInProgress
                          }
                        />
                        <Button
                          onClick={handlePrintClick}
                          label="Напечатать этикетки"
                          disabled={
                            importInProgress || generateBarcodesInProgress
                          }
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
              onClick={handleDownloadClick}
              label="Скачать этикетки"
              disabled={importInProgress}
            />
            <Button
              onClick={handlePrintClick}
              label="Напечатать этикетки"
              disabled={importInProgress}
            />
          </div>
        }
        hideCloseButton={importInProgress}
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
      <Modal
        isOpen={generateBarcodesInProgress}
        onClose={() => setGenerateBarcodesInProgress(false)}
        title="Генерация этикеток"
        hideCloseButton={generateBarcodesInProgress}
      >
        <p className="mb-4 flex flex-col items-center justify-center gap-4">
          Идет генерация этикеток, пожалуйста, не закрывайте это окно
          <Loader />
        </p>
      </Modal>
    </Layout>
  );
});

export default Imports;
