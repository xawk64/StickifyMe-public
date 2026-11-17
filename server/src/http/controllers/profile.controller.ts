import { AppError } from "../../errors";
import type { ProfileService } from "../../services/profile.service";
import { asyncHandler } from "../asyncHandler";
import { currentUserId } from "../middlewares/auth";

export function createProfileController(profiles: ProfileService) {
  return {
    update: asyncHandler(async (req, res) => {
      await profiles.update(currentUserId(req), req.body);
      res.status(200).send({ message: "was success!" });
    }),

    setWbApiKey: asyncHandler(async (req, res) => {
      await profiles.setWbApiKey(currentUserId(req), req.body.apiKey);
      res.status(200).send({ hasWbApiKey: true });
    }),

    uploadAvatar: asyncHandler(async (req, res) => {
      const file = req.files?.avatar;
      if (!file || Array.isArray(file)) {
        throw new AppError(400, "Файл не загружен");
      }
      const avatarUrl = await profiles.uploadAvatar(currentUserId(req), file);
      res.send({ avatarUrl });
    }),
  };
}
