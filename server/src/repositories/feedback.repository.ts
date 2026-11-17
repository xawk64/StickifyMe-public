import { FeedbackModel } from "../models";

export class FeedbackRepository {
  async create(feedback: {
    message: string;
    type: string;
    userId: string;
    userEmail: string;
  }): Promise<void> {
    await FeedbackModel.create(feedback);
  }
}
