import type { HydratedDocument } from "mongoose";
import { UserModel, type User } from "../models";

export type UserDocument = HydratedDocument<User>;

export type NewUser = Pick<
  User,
  | "username"
  | "email"
  | "password"
  | "profileId"
  | "emailVerification"
  | "emailVerificationHash"
>;

export class UserRepository {
  findById(id: string): Promise<UserDocument | null> {
    return UserModel.findById(id).exec();
  }

  findAll(): Promise<UserDocument[]> {
    return UserModel.find().exec();
  }

  /** The web app sends either a username or an email in the login field. */
  findByLogin(login: string): Promise<UserDocument | null> {
    return UserModel.findOne({ $or: [{ username: login }, { email: login }] }).exec();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email }).exec();
  }

  findByProfileId(profileId: string): Promise<UserDocument | null> {
    return UserModel.findOne({ profileId }).exec();
  }

  async usernameExists(username: string): Promise<boolean> {
    return (await UserModel.exists({ username })) !== null;
  }

  async emailExists(email: string): Promise<boolean> {
    return (await UserModel.exists({ email })) !== null;
  }

  create(user: NewUser): Promise<UserDocument> {
    return UserModel.create(user);
  }

  /** @returns false when no user has this verification hash */
  async markEmailVerified(verificationHash: string): Promise<boolean> {
    const result = await UserModel.updateOne(
      { emailVerificationHash: verificationHash },
      { emailVerification: true },
    );
    return result.matchedCount > 0;
  }

  async setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expires: Date,
  ): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      { resetPasswordToken: tokenHash, resetPasswordExpires: expires },
    );
  }

  findByValidResetToken(tokenHash: string): Promise<UserDocument | null> {
    return UserModel.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).exec();
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: { password: passwordHash },
        $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
      },
    );
  }
}
