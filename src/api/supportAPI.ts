import { post } from "./index";
import { IServerMessageResponse } from "./models/ServerMessageResponseType";

interface ISendFeedbackParams {
  message: string;
  type: string;
}

const supportAPI = {
  sendFeedback: (params: ISendFeedbackParams): Promise<IServerMessageResponse> =>
    post("/api/support/feedback", params),
};

export default supportAPI; 