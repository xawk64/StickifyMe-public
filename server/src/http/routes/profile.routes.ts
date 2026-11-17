import { Router, type RequestHandler } from "express";
import type { ProfileService } from "../../services/profile.service";
import { createProfileController } from "../controllers/profile.controller";
import { validate } from "../middlewares/validate";
import * as schemas from "../schemas/profile.schemas";

export function createProfileRouter(
  profiles: ProfileService,
  requireAuth: RequestHandler,
): Router {
  const router = Router();
  const c = createProfileController(profiles);

  router.post(
    "/api/profile/",
    requireAuth,
    validate({ body: schemas.updateProfile }),
    c.update,
  );
  router.post("/api/upload-avatar", requireAuth, c.uploadAvatar);

  return router;
}
