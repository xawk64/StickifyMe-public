import { Schema, model } from "mongoose";

export interface User {
  username: string;
  email: string;
  password: string;
  profileId: string;
  emailVerification: boolean;
  emailVerificationHash?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    // unique indexes close the race window of the "check then insert" signup flow
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileId: String,
    emailVerification: Boolean,
    emailVerificationHash: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true },
);

export const UserModel = model<User>("User", userSchema);
