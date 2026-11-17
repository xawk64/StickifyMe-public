const { authJwt } = require("../middlewares");
const controller = require("../controllers/telegram.controller");

module.exports = function (app) {
  app.post(
    "/api/telegram/link-token",
    [authJwt.authAPIverifyToken],
    controller.createLinkToken,
  );
};
