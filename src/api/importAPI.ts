import { ApiError, postNdjson } from ".";
import { ApiUrlEnum } from "../utils/enums";
import { IOrder } from "./models/OrderType";

export interface ImportProgress {
  done: number;
  total: number;
  remainingMs: number;
}

type ImportEvent =
  | ({ type: "progress" } & ImportProgress)
  | { type: "result"; orders: IOrder[] }
  | { type: "error"; status: number; message: string };

async function runImport(
  url: string,
  body: Record<string, unknown>,
  onProgress: (progress: ImportProgress) => void
): Promise<IOrder[]> {
  let orders: IOrder[] | null = null;
  await postNdjson<ImportEvent>(url, body, (event) => {
    if (event.type === "progress") {
      onProgress(event);
    } else if (event.type === "result") {
      orders = event.orders;
    } else {
      throw new ApiError(event.status, event.message);
    }
  });
  if (!orders) {
    throw new ApiError(502, "Импорт прерван: сервер не вернул результат");
  }
  return orders;
}

const importAPI = {
  /** Orders in assembly created during the last `days` days, with stickers and product data. */
  importFromWb: (days: number, onProgress: (progress: ImportProgress) => void) =>
    runImport(ApiUrlEnum.importFromWb, { days }, onProgress),
};

export default importAPI;
