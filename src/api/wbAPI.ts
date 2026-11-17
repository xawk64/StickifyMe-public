import { getStickersDelay, maxStickers } from "../utils/constants";
import { IWarehouse } from "./models/GetWarehousesResponseType";
import { IOrder } from "./models/OrderType";
import { IProduct } from "./models/ProductType";
import { IStickersType } from "./models/StickersType";

const wbAPI = {
  checkApiKey: async (apiKey: string) => {
    try {
      const response = await fetch(`https://content-api.wildberries.ru/ping`, {
        method: "GET",
        headers: {
          accept: "application/json",
          ["Content-Type"]: "application/json",
          Authorization: apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error("Error checking API key:", error);
      return false;
    }
  },
  loadWarehouses: async (token: string) => {
    try {
      const response = await fetch(
        "https://supplies-api.wildberries.ru/api/v1/warehouses",
        {
          method: "GET",
          headers: {
            accept: "application/json",
            ["Content-Type"]: "application/json",
            Authorization: token,
          },
        }
      );
      const data: IWarehouse[] = await response.json();
      return data;
    } catch (error) {
      console.error("Error loading warehouses:", error);
      return [];
    }
  },
  loadBarcodes: async (
    ordersIds: number[],
    token: string
  ): Promise<{ [key: number]: IStickersType }> => {
    const response = await fetch(
      "https://marketplace-api.wildberries.ru/api/v3/orders/stickers?type=png&width=58&height=40",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          ["Content-Type"]: "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          ["orders"]: ordersIds,
        }),
      }
    );
    const data = await response.json();
    const stickers: { [key: number]: IStickersType } = data.stickers.reduce(
      (
        acc: { [key: number]: IStickersType },
        curr: {
          partA: string;
          partB: string;
          barcode: string;
          orderId: number;
          file: string;
        }
      ) => ({
        ...acc,
        [curr.orderId]: {
          bcUp: curr.partA,
          bcDown: curr.partB,
          barcode: curr.barcode,
          barcodeFile: curr.file,
        },
      }),
      {} as { [key: number]: IStickersType }
    );

    return stickers;
  },
  loadProduct: async (productId: number, token: string): Promise<IProduct> => {
    const response = await fetch(
      "https://content-api.wildberries.ru/content/v2/get/cards/list?locale=ru",
      {
        method: "POST",
        headers: {
          Authorization: token,
        },
        body: JSON.stringify({
          settings: {
            cursor: { limit: 100 },
            filter: {
              textSearch: `${productId}`,
              withPhoto: -1,
            },
          },
        }),
      }
    );
    const data = await response.json();
    const {
      nmID,
      brand,
      createdAt,
      description,
      subjectName,
      title,
      vendorCode,
      updatedAt,
      characteristics,
      sizes,
    } = data.cards[0];
    const product: IProduct = {
      id: nmID,
      barcode: sizes[0].skus[0],
      brand,
      description,
      subjectName,
      title,
      vendorCode,
      createdAtMarket: createdAt,
      updatedAtMarket: updatedAt,
      characteristics: characteristics.reduce(
        (
          acc: { name: string; value: string[] },
          curr: { name: string; value: string[] }
        ) => ({
          ...acc,
          [curr.name]: Array.isArray(curr.value) ? curr.value : [curr.value],
        }),
        {} as { [key: string]: string[] }
      ),
    };
    return product;
  },
  loadOrders: async (
    token: string,
    setLoadingProgress: (value: number) => void,
    setRemainingTime: (value: number) => void,
    daysCountForOrders: number
  ): Promise<IOrder[] | undefined> => {
    try {
      let loadingProgress = 0;
      let orders: IOrder[] = [];
      let next = 0;

      do {
        const response = await fetch(
          `https://marketplace-api.wildberries.ru/api/v3/orders?limit=1000&next=${next}&dateFrom=${
            Math.floor(Date.now() / 1000) - 60 * 60 * 24 * daysCountForOrders
          }&dateTo=${Math.floor(Date.now() / 1000)}`,
          {
            headers: {
              Authorization: token,
            },
          }
        );
        const data = await response.json();
        orders = [...orders, ...data.orders];
        if (data.orders.length === 1000) {
          next = data.next;
        } else {
          next = 0;
        }
      } while (next !== 0);

      if (orders) {
        let ordersIds = orders.map((order: IOrder) => order.id);
        const batchSize = 1000;
        const ordersStatuses: {
          orders: { id: number; supplierStatus: string }[];
        } = { orders: [] };

        for (let i = 0; i < ordersIds.length; i += batchSize) {
          const batchIds = ordersIds.slice(i, i + batchSize);
          const ordersStatusesResponse = await fetch(
            "https://marketplace-api.wildberries.ru/api/v3/orders/status",
            {
              method: "POST",
              headers: {
                accept: "application/json",
                ["Content-Type"]: "application/json",
                Authorization: token,
              },
              body: JSON.stringify({
                ["orders"]: batchIds,
              }),
            }
          );
          const batchStatuses = await ordersStatusesResponse.json();
          ordersStatuses.orders.push(...batchStatuses.orders);
        }
        const orderStatusById: { [key: string]: string } =
          ordersStatuses.orders.reduce(
            (
              acc: { [key: string]: string },
              curr: { id: number; supplierStatus: string }
            ) => ({ ...acc, [curr.id]: curr.supplierStatus }),
            {} as { [key: string]: string }
          );

        orders = orders.filter(
          ({ id }: IOrder) => orderStatusById[String(id)] === "confirm"
        );

        if (orders.length === 0) {
          return [];
        }

        ordersIds = orders.map((order: IOrder) => order.id);

        const onePercent = 100 / orders.length;

        if (orders.length > maxStickers) {
          setRemainingTime(
            (getStickersDelay / 1000) * Math.ceil(orders.length / maxStickers)
          );
        }

        const processOrders = async (
          ordersToProcess: IOrder[],
          processedOrders: IOrder[] = []
        ) => {
          if (ordersToProcess.length === 0) {
            return processedOrders;
          }

          const batchSize = maxStickers;
          const currentBatch = ordersToProcess.slice(0, batchSize);
          const remainingOrders = ordersToProcess.slice(batchSize);

          const ordersIds = currentBatch.map((order: IOrder) => order.id);
          const stickers = await wbAPI.loadBarcodes(ordersIds, token);

          const processedBatch = await Promise.all<IOrder>(
            currentBatch.map(
              async ({ id, nmId, createdAt, deliveryType }: any) => {
                let product: IProduct | undefined;
                let attempts = 0;
                const maxAttempts = 15;

                while (attempts < maxAttempts) {
                  try {
                    product = await wbAPI.loadProduct(nmId, token);
                    break;
                  } catch (err) {
                    attempts++;
                    if (attempts === maxAttempts) throw err;
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                  }
                }

                if (!product) {
                  throw new Error(`Failed to load product for nmId: ${nmId}`);
                }

                loadingProgress += onePercent;
                setLoadingProgress(loadingProgress);

                const barcodesInfo = stickers[id];
                return {
                  id,
                  nmId,
                  createdAtMarket: createdAt,
                  deliveryType,
                  stickersCount: 1,
                  product,
                  bcUp: barcodesInfo?.bcUp || "2439286",
                  bcDown: barcodesInfo?.bcDown || "7401",
                  barcode: barcodesInfo?.barcode || "*Ba3tnkmJ",
                  barcodeFile: barcodesInfo?.barcodeFile,
                };
              }
            )
          );

          const newProcessedOrders = [...processedOrders, ...processedBatch];

          setRemainingTime(
            (getStickersDelay / 1000) *
              Math.ceil(remainingOrders.length / maxStickers)
          );

          if (remainingOrders.length > 0) {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(processOrders(remainingOrders, newProcessedOrders));
              }, getStickersDelay);
            });
          } else {
            return newProcessedOrders;
          }
        };

        orders = (await processOrders(orders)) as IOrder[];

        orders = orders.filter(({ barcodeFile }: IOrder) => !!barcodeFile);

        return orders;
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      return [];
    }
  },
  loadProductsInfo: async (
    orders: IOrder[],
    withFullInfo = true,
    token: string,
    setLoadingProgress: (value: number) => void,
    setRemainingTime: (value: number) => void
  ): Promise<IOrder[]> => {
    let loadingProgress = 0;
    const onePercent = 100 / orders.length;
    const ordersIds = orders.map((order) => order.id);
    const ordersStatusesResponse = await fetch(
      "https://marketplace-api.wildberries.ru/api/v3/orders/status",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          ["Content-Type"]: "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          ["orders"]: ordersIds,
        }),
      }
    );
    const ordersStatuses = await ordersStatusesResponse.json();

    const orderStatusById: { [key: string]: string } =
      ordersStatuses.orders.reduce(
        (
          acc: { [key: string]: string },
          curr: { id: number; supplierStatus: string }
        ) => ({ ...acc, [curr.id]: curr.supplierStatus }),
        {} as { [key: string]: string }
      );

    orders = orders.filter(
      ({ id }: IOrder) => orderStatusById[String(id)] === "confirm"
    );

    if (orders.length === 0) {
      return [];
    }

    if (orders.length > maxStickers) {
      setRemainingTime(
        (getStickersDelay / 1000) * Math.ceil(orders.length / maxStickers)
      );
    }

    const processOrders = async (
      ordersToProcess: IOrder[],
      processedOrders: IOrder[] = []
    ): Promise<IOrder[]> => {
      if (ordersToProcess.length === 0) {
        return processedOrders;
      }

      const batchSize = maxStickers;
      const currentBatch = ordersToProcess.slice(0, batchSize);
      const remainingOrders = ordersToProcess.slice(batchSize);

      const ordersIds = currentBatch.map((order: IOrder) => order.id);
      const stickers = await wbAPI.loadBarcodes(ordersIds, token);

      const processedBatch = await Promise.all<IOrder>(
        currentBatch.map(
          async ({ id, nmId, createdAtMarket, deliveryType }: any) => {
            let product: IProduct | undefined;
            let attempts = 0;
            const maxAttempts = 15;

            while (attempts < maxAttempts) {
              try {
                product = await wbAPI.loadProduct(nmId, token);
                break;
              } catch (err) {
                attempts++;
                if (attempts === maxAttempts) throw err;
                await new Promise((resolve) => setTimeout(resolve, 2000));
              }
            }

            if (!product) {
              throw new Error(`Failed to load product for nmId: ${nmId}`);
            }

            loadingProgress += onePercent;
            setLoadingProgress(loadingProgress);

            const barcodesInfo = stickers[id];
            return {
              id,
              nmId,
              createdAtMarket,
              deliveryType,
              stickersCount: 1,
              product,
              bcUp: barcodesInfo?.bcUp || "",
              bcDown: barcodesInfo?.bcDown || "",
              barcode: barcodesInfo?.barcode || "",
              barcodeFile: barcodesInfo?.barcodeFile,
            };
          }
        )
      );

      setRemainingTime(
        (getStickersDelay / 1000) *
          Math.ceil(remainingOrders.length / maxStickers)
      );

      const newProcessedOrders = [...processedOrders, ...processedBatch];

      if (remainingOrders.length > 0) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(processOrders(remainingOrders, newProcessedOrders));
          }, getStickersDelay); // Задержка в 5 секунд перед обработкой следующей партии
        });
      } else {
        return newProcessedOrders;
      }
    };

    orders = await processOrders(orders);

    orders = orders.filter(({ barcodeFile }) => !!barcodeFile);

    return orders;
  },
};

export default wbAPI;
