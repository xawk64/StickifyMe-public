const { authJwt } = require("../middlewares");
const controller = require("../controllers/barcodesHistory.controller");
const { validate } = require("../http/middlewares/validate");
const schemas = require("../validation/barcodes.schemas");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept",
    );
    next();
  });

  app.post(
    "/api/barcodes-history/add",
    [authJwt.authAPIverifyToken, validate({ body: schemas.addHistory })],
    controller.addBarcodes,
  );
};
