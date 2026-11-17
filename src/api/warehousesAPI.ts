import { get, post } from ".";
import { ApiUrlEnum } from "../utils/enums";
import { IServerMessageResponse } from "./models/ServerMessageResponseType";
import { IWarehouseSettings } from "./models/WarehouseSettings";

/** Dates may be sent as Date objects: they are serialized to ISO strings. */
export interface SaveWarehouseSettingsParams {
  settings: {
    enabled: boolean;
    items: (Omit<IWarehouseSettings["items"][number], "dateStart" | "dateEnd"> & {
      dateStart: Date | string;
      dateEnd: Date | string;
    })[];
  };
}

const warehousesAPI = {
  setWarehousesSettings: (params: SaveWarehouseSettingsParams) =>
    post<IServerMessageResponse>(ApiUrlEnum.setWarehousesSettings, params),
  getWarehousesSettings: () => get<IWarehouseSettings>(ApiUrlEnum.getWarehousesSettings),
};

export default warehousesAPI;
