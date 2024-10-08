import { get, post } from ".";
import { ApiUrlEnum } from "../utils/enums";

export default {
  setWarehousesSettings: (params: any) =>
    post(`${ApiUrlEnum.setWarehousesSettings}`, params),
  getWarehousesSettings: () => get(`${ApiUrlEnum.getWarehousesSettings}`),
};
