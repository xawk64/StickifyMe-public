import { Schema, model } from "mongoose";

export interface Profile {
  fullName?: string;
  avatarUrl?: string;
  chatId?: number | null;
  /** Seller's WB API key encrypted with SecretBox (AES-256-GCM); never sent to clients. */
  wbApiKeyEncrypted?: string;
  // one-time token for the Telegram deep link, stored as a SHA-256 hash
  telegramLinkTokenHash?: string;
  telegramLinkTokenExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<Profile>(
  {
    fullName: String,
    avatarUrl: String,
    chatId: Number,
    wbApiKeyEncrypted: String,
    telegramLinkTokenHash: { type: String, index: true },
    telegramLinkTokenExpires: Date,
  },
  { timestamps: true },
);

export const ProfileModel = model<Profile>("Profile", profileSchema);
