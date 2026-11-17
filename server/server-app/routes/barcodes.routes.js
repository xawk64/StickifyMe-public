const controller = require("../controllers/barcodes.controller");
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
    [authJwt.authAPIverifyToken],
    controller.generateBarcode,
  );

  app.get("/api/barcodes/history", [authJwt.authAPIverifyToken], controller.getHistory);

  app.get(
    "/api/barcodes/history/:historyId",
    [authJwt.authAPIverifyToken],
    controller.getHistoryById,
  );
};
