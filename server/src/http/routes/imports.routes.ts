import { Router, type RequestHandler } from "express";
import type { Logger } from "../../logger";
import type { ImportService } from "../../services/import.service";
import { asyncHandler } from "../asyncHandler";
import { currentUserId } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { streamNdjson } from "../ndjson";
import * as schemas from "../schemas/imports.schemas";

/**
 * Import endpoints stream NDJSON:
 *   {"type":"progress","done":3,"total":40,"remainingMs":120000}
 *   {"type":"result","orders":[...]}   or   {"type":"error","status":400,"message":"..."}
 */
export function createImportsRouter(
  imports: ImportService,
  requireAuth: RequestHandler,
  log: Logger,
): Router {
  const router = Router();

  router.post(
    "/api/imports/wb",
    requireAuth,
    validate({ body: schemas.importFromWb }),
    asyncHandler((req, res) =>
      streamNdjson(res, log, async (emit) => ({
        orders: await imports.importFromWb(
          currentUserId(req),
          req.body.days,
          (progress) => emit({ type: "progress", ...progress }),
        ),
      })),
    ),
  );

  return router;
}
