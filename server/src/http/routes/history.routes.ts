import { Router, type RequestHandler } from "express";
import type { HistoryService } from "../../services/history.service";
import { createHistoryController } from "../controllers/history.controller";
import { validate } from "../middlewares/validate";
import * as schemas from "../schemas/barcodes.schemas";

export function createHistoryRouter(
  history: HistoryService,
  requireAuth: RequestHandler,
): Router {
  const router = Router();
  const c = createHistoryController(history);

  router.post(
    "/api/barcodes-history/add",
    requireAuth,
    validate({ body: schemas.addHistory }),
    c.add,
  );
  router.get(
    "/api/barcodes/history",
    requireAuth,
    validate({ query: schemas.historyPage }),
    c.list,
  );
  router.get(
    "/api/barcodes/history/:historyId",
    requireAuth,
    validate({ params: schemas.historyId }),
    c.get,
  );

  return router;
}
