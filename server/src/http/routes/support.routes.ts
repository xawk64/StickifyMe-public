import { Router, type RequestHandler } from "express";
import type { SupportService } from "../../services/support.service";
import { asyncHandler } from "../asyncHandler";
import { currentUserId } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import * as schemas from "../schemas/support.schemas";

export function createSupportRouter(
  support: SupportService,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.post(
    "/api/support/feedback",
    requireAuth,
    validate({ body: schemas.feedback }),
    asyncHandler(async (req, res) => {
      await support.sendFeedback(currentUserId(req), req.body);
      res.status(200).send({ message: "Сообщение успешно отправлено" });
    }),
  );

  return router;
}
