import { randomUUID } from "node:crypto";
import { AppError, ConflictError, NotFoundError, UnauthorizedError } from "../errors";
import type { Mailer } from "../mail/mailer";
import * as templates from "../mail/templates";
import { signAccessToken } from "../http/middlewares/auth";
import type { ProfileDocument, Repositories, UserDocument } from "../repositories";
import { hashPassword, verifyPassword } from "../utils/password";
import { hashToken } from "../utils/tokens";

const DUPLICATE_KEY_ERROR = 11000;
const ACCESS_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const INVALID_CREDENTIALS = "Неверный логин или пароль";

export type MailSender = Pick<Mailer, "send" | "notifyAdmin">;

export interface AuthServiceDeps {
  repositories: Pick<Repositories, "users" | "profiles" | "monitoring">;
  mailer: MailSender;
  jwtSecret: string;
  appUrl: string;
}

export interface SignupInput {
  username: string;
  email: string;
  password: string;
}

export interface UserWithProfile {
  user: UserDocument;
  profile: ProfileDocument | null;
}

const isDuplicateKeyError = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  (err as { code?: unknown }).code === DUPLICATE_KEY_ERROR;

export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  private get repos() {
    return this.deps.repositories;
  }

  async signup({ username, email, password }: SignupInput): Promise<void> {
    // Friendly early check; uniqueness itself is guaranteed by the unique indexes.
    if (await this.repos.users.usernameExists(username)) {
      throw new ConflictError("Имя пользователя уже используется!");
    }
    if (await this.repos.users.emailExists(email)) {
      throw new ConflictError("Email уже используется!");
    }

    // MongoDB standalone has no multi-document transactions: compensate manually.
    const rollback: (() => Promise<unknown>)[] = [];
    try {
      const profile = await this.repos.profiles.create(username);
      rollback.push(() => profile.deleteOne());
      const defaults = await this.repos.monitoring.createDefaults(String(profile._id));
      rollback.push(defaults.deleteAll);
      await this.repos.users.create({
        username,
        email,
        password: await hashPassword(password),
        emailVerification: true,
        emailVerificationHash: randomUUID(),
        profileId: String(profile._id),
      });
    } catch (err) {
      await Promise.allSettled(rollback.map((undo) => undo()));
      if (isDuplicateKeyError(err)) {
        throw new ConflictError("Имя пользователя или email уже используется!");
      }
      throw err;
    }

    // Notifications must not delay or fail the signup.
    void this.deps.mailer.notifyAdmin(templates.adminNewSignup({ email, username }));
    void this.deps.mailer.send(
      email,
      templates.welcome({ username, appUrl: this.deps.appUrl }),
    );
  }

  async signin(
    login: string,
    password: string,
  ): Promise<UserWithProfile & { accessToken: string }> {
    const user = await this.repos.users.findByLogin(login);
    // verifyPassword runs bcrypt even without a user to keep the timing uniform
    const passwordIsValid = await verifyPassword(password, user?.password);
    if (!user || !passwordIsValid) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }
    const profile = await this.repos.profiles.findById(user.profileId);
    const accessToken = signAccessToken(
      user.id,
      this.deps.jwtSecret,
      ACCESS_TOKEN_TTL_SECONDS,
    );
    return { user, profile, accessToken };
  }

  async me(userId: string): Promise<UserWithProfile> {
    const user = await this.repos.users.findById(userId);
    if (!user) {
      throw new NotFoundError("Пользователь не найден.");
    }
    return { user, profile: await this.repos.profiles.findById(user.profileId) };
  }

  async verifyEmail(hash: string): Promise<void> {
    if (!(await this.repos.users.markEmailVerified(hash))) {
      throw new NotFoundError("Пользователь для подтверждения почты не найден.");
    }
  }

  /** Same outcome whether or not the email exists: no account enumeration. */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.repos.users.findByEmail(email);
    if (!user) {
      return;
    }
    const resetToken = randomUUID();
    await this.repos.users.setPasswordResetToken(
      user.id,
      hashToken(resetToken),
      new Date(Date.now() + RESET_TOKEN_TTL_MS),
    );
    const profile = await this.repos.profiles.findById(user.profileId);
    await this.deps.mailer.send(
      user.email,
      templates.passwordReset({
        name: profile?.fullName || user.username,
        link: `${this.deps.appUrl}/reset-password?token=${resetToken}`,
      }),
    );
  }

  async confirmPasswordReset(token: string, password: string): Promise<void> {
    const user = await this.repos.users.findByValidResetToken(hashToken(token));
    if (!user) {
      throw new AppError(400, "Токен для сброса пароля недействителен или истек.");
    }
    await this.repos.users.updatePassword(user.id, await hashPassword(password));
  }

  async resendVerification(userId: string): Promise<void> {
    const user = await this.repos.users.findById(userId);
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }
    if (user.emailVerification) {
      throw new AppError(400, "Email уже подтвержден");
    }
    await this.deps.mailer.send(
      user.email,
      templates.verificationReminder({
        username: user.username,
        link: `${this.deps.appUrl}/verify/?hash=${user.emailVerificationHash}`,
      }),
    );
  }
}
