import { Router, type RequestHandler } from "express";
import type { AuthService } from "../../services/auth.service";
import { createAuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import * as schemas from "../schemas/auth.schemas";

export function createAuthRouter(auth: AuthService, requireAuth: RequestHandler): Router {
  const router = Router();
  const c = createAuthController(auth);

  router.post("/api/auth/signup", validate({ body: schemas.signup }), c.signup);
  router.post("/api/auth/signin", validate({ body: schemas.signin }), c.signin);
  router.post("/api/auth/verify", validate({ body: schemas.verifyEmail }), c.verify);
  router.get("/api/auth/me", requireAuth, c.me);
  router.post(
    "/api/auth/reset-password",
    validate({ body: schemas.resetPassword }),
    c.resetPassword,
  );
  router.post(
    "/api/auth/confirm-reset-password",
    validate({ body: schemas.confirmResetPassword }),
    c.confirmResetPassword,
  );
  router.get("/api/auth/resend-verification", requireAuth, c.resendVerification);

  return router;
}
