import { Router, type RequestHandler } from "express";
import type { TelegramLinkService } from "../../services/telegramLink.service";
import { asyncHandler } from "../asyncHandler";
import { currentUserId } from "../middlewares/auth";

export function createTelegramRouter(
  telegramLink: TelegramLinkService,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.post(
    "/api/telegram/link-token",
    requireAuth,
    asyncHandler(async (req, res) => {
      res
        .status(200)
        .send({ token: await telegramLink.createLinkToken(currentUserId(req)) });
    }),
  );

  return router;
}
