import { download, get, post } from ".";
import { ApiUrlEnum } from "../utils/enums";
import { IAddHistoryParams } from "./models/AddHistoryParamsType";
import { GenerateBarcodesParams } from "./models/GenerateBarcodesParamsType";
import { IGetHistoryByIdParams } from "./models/GetHistoryByIdParamsType";
import { IGetHistoryByIdResponse } from "./models/GetHistoryByIdResponseType";
import { IGetHistoryParams } from "./models/GetHistoryParamsType";
import { IGetHistoryResponse } from "./models/GetHistoryResponseType";

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  loadGenerateBarcode: (params: GenerateBarcodesParams, print: boolean) =>
    download(ApiUrlEnum.generateBarcode, params, print),

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
