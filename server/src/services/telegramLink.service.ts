import { NotFoundError } from "../errors";
import type { ProfileDocument, Repositories, UserDocument } from "../repositories";
import { hashToken, randomToken } from "../utils/tokens";

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;
export const LINK_TOKEN_PATTERN = /^[\w-]{20,64}$/;

/**
 * Links a Telegram chat to an account through a one-time token:
 * the web app gets the token, the user opens t.me/<bot>?start=<token>,
 * the bot consumes it. Only the token hash is stored.
 */
export class TelegramLinkService {
  constructor(private readonly repositories: Pick<Repositories, "users" | "profiles">) {}

  async createLinkToken(userId: string): Promise<string> {
    const user = await this.repositories.users.findById(userId);
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }
    const token = randomToken();
    await this.repositories.profiles.setTelegramLinkToken(
      user.profileId,
      hashToken(token),
      new Date(Date.now() + LINK_TOKEN_TTL_MS),
    );
    return token;
  }

  /** @returns the linked profile and its user, or null for an invalid/expired/used token */
  async linkChat(
    token: string,
    chatId: number,
  ): Promise<{ profile: ProfileDocument; user: UserDocument | null } | null> {
    if (!LINK_TOKEN_PATTERN.test(token)) {
      return null;
    }
    const profile = await this.repositories.profiles.consumeTelegramLinkToken(
      hashToken(token),
      chatId,
    );
    if (!profile) {
      return null;
    }
    const user = await this.repositories.users.findByProfileId(String(profile._id));
    return { profile, user };
  }

  unlinkChat(chatId: number): Promise<void> {
    return this.repositories.profiles.unlinkChat(chatId);
  }
}
