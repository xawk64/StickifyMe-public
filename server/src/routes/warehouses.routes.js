const controller = require("../controllers/warehouse.controller");
const { validate } = require("../middlewares/validate");
const schemas = require("../validation/warehouses.schemas");
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
    "/api/warehouses/settings",
    [authJwt.authAPIverifyToken, validate({ body: schemas.saveSettings })],
    controller.setSettings,
  );
  app.get(
    "/api/warehouses/settings/get",
    [authJwt.authAPIverifyToken],
    controller.getSettings,
  );
};
