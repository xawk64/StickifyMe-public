import { post } from ".";
import { ApiUrlEnum } from "../utils/enums";

export interface TelegramLinkTokenResponse {
  token: string;
}

const telegramAPI = {
  createLinkToken: (): Promise<TelegramLinkTokenResponse> =>
    post(ApiUrlEnum.telegramLinkToken),
};

export default telegramAPI;
