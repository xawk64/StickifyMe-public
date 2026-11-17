import type { HydratedDocument } from "mongoose";
import { ProfileModel, type Profile } from "../models";

export type ProfileDocument = HydratedDocument<Profile>;

export type ProfileUpdate = Partial<
  Pick<Profile, "fullName" | "wbApiKeyEncrypted" | "avatarUrl">
>;

export class ProfileRepository {
  findById(id: string): Promise<ProfileDocument | null> {
    return ProfileModel.findById(id).exec();
  }

  create(fullName: string): Promise<ProfileDocument> {
    return ProfileModel.create({ fullName });
  }

  async update(id: string, fields: ProfileUpdate): Promise<void> {
    await ProfileModel.updateOne({ _id: id }, fields);
  }

  async setTelegramLinkToken(
    id: string,
    tokenHash: string,
    expires: Date,
  ): Promise<void> {
    await ProfileModel.updateOne(
      { _id: id },
      { telegramLinkTokenHash: tokenHash, telegramLinkTokenExpires: expires },
    );
  }

  /**
   * Atomically consumes a one-time link token and binds the chat to the profile,
   * so the same token can never be replayed.
   */
  consumeTelegramLinkToken(
    tokenHash: string,
    chatId: number,
  ): Promise<ProfileDocument | null> {
    return ProfileModel.findOneAndUpdate(
      { telegramLinkTokenHash: tokenHash, telegramLinkTokenExpires: { $gt: new Date() } },
      {
        $set: { chatId },
        $unset: { telegramLinkTokenHash: 1, telegramLinkTokenExpires: 1 },
      },
      { new: true },
    ).exec();
  }

  async unlinkChat(chatId: number): Promise<void> {
    await ProfileModel.updateOne({ chatId }, { $set: { chatId: null } });
  }
}
