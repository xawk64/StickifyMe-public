import { randomUUID } from "node:crypto";
import path from "node:path";
import { AppError, NotFoundError } from "../errors";
import type { ProfileUpdate, Repositories } from "../repositories";
import { detectImageExtension } from "../utils/imageType";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** The subset of an express-fileupload file the service needs. */
export interface UploadedFile {
  data: Buffer;
  size: number;
  mv(targetPath: string): Promise<void>;
}

export interface ProfileServiceDeps {
  repositories: Pick<Repositories, "users" | "profiles">;
  uploadsDir: string;
}

export class ProfileService {
  constructor(private readonly deps: ProfileServiceDeps) {}

  private async profileIdOf(userId: string): Promise<string> {
    const user = await this.deps.repositories.users.findById(userId);
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }
    return user.profileId;
  }

  /** `fields` is already reduced to user-editable fields by the request schema. */
  async update(userId: string, fields: Pick<ProfileUpdate, "fullName" | "wbApiKey">) {
    await this.deps.repositories.profiles.update(await this.profileIdOf(userId), fields);
  }

  /** Stores an avatar under a server-generated name and returns its public URL. */
  async uploadAvatar(userId: string, file: UploadedFile): Promise<string> {
    if (file.size > AVATAR_MAX_BYTES) {
      throw new AppError(413, "Файл слишком большой (максимум 2 МБ)");
    }
    const extension = detectImageExtension(file.data);
    if (!extension) {
      throw new AppError(400, "Допустимы только изображения PNG, JPEG или WebP");
    }

    const profileId = await this.profileIdOf(userId);
    // The file name is generated on the server: the client name is never used in the path.
    const fileName = `${userId}-${randomUUID()}.${extension}`;
    await file.mv(path.join(this.deps.uploadsDir, "avatars", fileName));

    const avatarUrl = `/uploads/avatars/${fileName}`;
    await this.deps.repositories.profiles.update(profileId, { avatarUrl });
    return avatarUrl;
  }
}
