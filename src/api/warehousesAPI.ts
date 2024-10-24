import { get, post } from ".";
import { ApiUrlEnum } from "../utils/enums";

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  setWarehousesSettings: (params: unknown) =>
    post(`${ApiUrlEnum.setWarehousesSettings}`, params),
  getWarehousesSettings: () => get(`${ApiUrlEnum.getWarehousesSettings}`),
};
