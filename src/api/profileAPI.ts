import { post, put } from ".";
import { ApiUrlEnum } from "../utils/enums";
import { IServerMessageResponse } from "./models/ServerMessageResponseType";

const profileAPI = {
  updateProfile: (params: { fullName: string }) =>
    post<IServerMessageResponse>(ApiUrlEnum.updateProfile, params),
  /** The API checks the key against WB and stores it encrypted. */
  setWbApiKey: (apiKey: string) =>
    put<{ hasWbApiKey: boolean }>(ApiUrlEnum.setWbApiKey, { apiKey }),
};

export default profileAPI;
