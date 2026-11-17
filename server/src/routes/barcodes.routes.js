const controller = require("../controllers/barcodes.controller");
const { validate } = require("../http/middlewares/validate");
const schemas = require("../http/schemas/barcodes.schemas");
const { authJwt } = require("../middlewares");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept",
    );
    next();
  });

  app.post(
    "/api/barcodes/generate",
    [authJwt.authAPIverifyToken, validate({ body: schemas.generateLabels })],
    controller.generateBarcode,
  );
};
