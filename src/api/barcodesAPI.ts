import { download, get, post } from ".";
import { ApiUrlEnum } from "../utils/enums";
import { IAddHistoryParams } from "./models/AddHistoryParamsType";
import { GenerateBarcodesParams } from "./models/GenerateBarcodesParamsType";
import { IGetHistoryByIdParams } from "./models/GetHistoryByIdParamsType";
import { IGetHistoryByIdResponse } from "./models/GetHistoryByIdResponseType";
import { IGetHistoryParams } from "./models/GetHistoryParamsType";
import { IGetHistoryResponse } from "./models/GetHistoryResponseType";

export default {
  loadGenerateBarcode: (params: GenerateBarcodesParams) =>
    download(ApiUrlEnum.generateBarcode, params),
  addBarcodesHistory: (params: IAddHistoryParams) =>
    post(`${ApiUrlEnum.addBarcodesHistory}`, params),
  loadBarcodesHistory: (
    params: IGetHistoryParams
  ): Promise<{ items: IGetHistoryResponse[]; count: number }> =>
    get(
      `${ApiUrlEnum.getBarcodesHistory}?page=${params.page}&limit=${params.limit}`
    ),
  loadBarcodesHistoryById: (
    params: IGetHistoryByIdParams
  ): Promise<IGetHistoryByIdResponse> =>
    get(`${ApiUrlEnum.getBarcodesHistory}/${params.id}`),
};
