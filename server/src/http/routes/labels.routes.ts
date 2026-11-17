import { Router, type RequestHandler } from "express";
import { renderLabelsPdf, type LabelsRequest } from "../../services/labels/labelPdf";
import { asyncHandler } from "../asyncHandler";
import { validate } from "../middlewares/validate";
import * as schemas from "../schemas/barcodes.schemas";

export function createLabelsRouter(requireAuth: RequestHandler): Router {
  const router = Router();

  router.post(
    "/api/barcodes/generate",
    requireAuth,
    validate({ body: schemas.generateLabels }),
    asyncHandler(async (req, res) => {
      // the body is validated against schemas.generateLabels
      const pdf = await renderLabelsPdf(req.body as LabelsRequest);
      res.set("Content-Disposition", 'attachment; filename="stickers.pdf"');
      res.type("application/pdf").send(pdf);
    }),
  );

  return router;
}
