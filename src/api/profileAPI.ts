import { post } from ".";
import { ApiUrlEnum } from "../utils/enums";

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  updateProfile: (params: { fullName: string; wbApiKey: string }) =>
    post(ApiUrlEnum.updateProfile, params),
};
