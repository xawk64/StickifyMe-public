import { Router, type RequestHandler } from "express";
import type { MonitoringSettingsService } from "../../services/monitoringSettings.service";
import { asyncHandler } from "../asyncHandler";
import { currentUserId } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import * as schemas from "../schemas/warehouses.schemas";

export function createMonitoringRouter(
  settings: MonitoringSettingsService,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.post(
    "/api/warehouses/settings",
    requireAuth,
    validate({ body: schemas.saveSettings }),
    asyncHandler(async (req, res) => {
      await settings.save(currentUserId(req), req.body.settings);
      res.status(200).send({ message: "Настройки успешно сохранены!" });
    }),
  );

  router.get(
    "/api/warehouses/settings/get",
    requireAuth,
    asyncHandler(async (req, res) => {
      res.status(200).json(await settings.get(currentUserId(req)));
    }),
  );

  return router;
}
