import { get, post } from ".";
import { ApiUrlEnum } from "../utils/enums";
import { IServerMessageResponse } from "./models/ServerMessageResponseType";
import { SigninParamsType } from "./models/SigninParamsType";
import { SigninResponseType } from "./models/SigninResponseType";
import { SignupParamsType } from "./models/SignupParamsType";
import { SignupResponseType } from "./models/SignupResponseType";
import { VerifyEmailParamsType } from "./models/VerifyEmailParamsType";
import { VerifyEmailResponseType } from "./models/VerifyEmailResponseType";

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  loadSignup: (params: SignupParamsType): Promise<SignupResponseType> =>
    post(ApiUrlEnum.authSignup, params),
  loadSignIn: (params: SigninParamsType): Promise<SigninResponseType> =>
    post(ApiUrlEnum.authSignin, params),
  loadAuthMe: (): Promise<SigninResponseType> => get(ApiUrlEnum.authMe),
  loadVerifyEmail: (
    params: VerifyEmailParamsType
  ): Promise<VerifyEmailResponseType> => post(ApiUrlEnum.authVerify, params),
  resetPassword: (params: { email: string }): Promise<{ message: string }> =>
    post(ApiUrlEnum.authResetPassword, params),
  confirmResetPassword: (params: {
    token: string;
    password: string;
  }): Promise<{ message: string }> =>
    post(ApiUrlEnum.authConfirmResetPassword, params),
  resendVerification: (): Promise<IServerMessageResponse> =>
    get(ApiUrlEnum.authResendVerification),
};
