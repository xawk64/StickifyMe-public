const { authJwt } = require("../middlewares");
const controller = require("../controllers/support.controller");
const { validate } = require("../http/middlewares/validate");
const schemas = require("../http/schemas/support.schemas");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept",
    );
    next();
  });

  app.post(
    "/api/support/feedback",
    [authJwt.authAPIverifyToken, validate({ body: schemas.feedback })],
    controller.sendFeedback,
  );
};
