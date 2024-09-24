import { IOrder } from "./models/OrderType";
import { IProduct } from "./models/ProductType";
import { IStickersType } from "./models/StickersType";

const token =
  "***REMOVED***";

const wbAPI = {
  loadBarcodes: async (
    ordersIds: number[]
  ): Promise<{ [key: number]: IStickersType }> => {
    const response = await fetch(
      "https://marketplace-api.wildberries.ru/api/v3/orders/stickers?type=svg&width=58&height=40",
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
  loadProduct: async (productId: number): Promise<IProduct> => {
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
  loadOrders: async (): Promise<IOrder[] | undefined> => {
    const response = await fetch(
      `https://marketplace-api.wildberries.ru/api/v3/orders?limit=1000&next=0&dateFrom=${
        Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 2
      }&dateTo=${Math.floor(Date.now() / 1000)}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );
    const data = await response.json();
    let orders = data.orders;
    if (orders) {
      let ordersIds = orders.map((order: IOrder) => order.id);
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

      orders = orders.filter((_: any, i: number) => i < 30);

      ordersIds = orders.map((order: IOrder) => order.id);

      const stickers = await wbAPI.loadBarcodes(ordersIds);

      orders = await Promise.all<IOrder>(
        orders.map(async ({ id, nmId, createdAt, deliveryType }: any) => {
          const product = await wbAPI.loadProduct(nmId);

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
        })
      );

      return orders;
    }
  },
};

export default wbAPI;
