import { Schema, model, type Types } from "mongoose";

export interface Feedback {
  message: string;
  type: string;
  userId: Types.ObjectId;
  userEmail: string;
  status: "new" | "in_progress" | "resolved";
}

const feedbackSchema = new Schema<Feedback>(
  {
    message: String,
    type: String,
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userEmail: String,
    status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new" },
  },
  { timestamps: true },
);

export const FeedbackModel = model<Feedback>("Feedback", feedbackSchema);
