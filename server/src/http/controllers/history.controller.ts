import type { HistoryService } from "../../services/history.service";
import { asyncHandler } from "../asyncHandler";
import { currentUserId } from "../middlewares/auth";

export function createHistoryController(history: HistoryService) {
  return {
    add: asyncHandler(async (req, res) => {
      const id = await history.add(currentUserId(req), req.body.type, req.body.orders);
      res.status(200).json({ id });
    }),

    list: asyncHandler(async (req, res) => {
      // page and limit are coerced to numbers by the route schema
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      res.status(200).json(await history.list(currentUserId(req), page, limit));
    }),

    get: asyncHandler(async (req, res) => {
      const entry = await history.get(currentUserId(req), String(req.params.historyId));
      // the web client expects an empty object for a missing entry
      res.status(200).json(entry ?? {});
    }),
  };
}
