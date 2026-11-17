const { verifySignUp } = require("../middlewares");
const { authJwt } = require("../middlewares");
const controller = require("../controllers/auth.controller");
const { validate } = require("../http/middlewares/validate");
const schemas = require("../validation/auth.schemas");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept",
    );
    next();
  });

  app.post(
    "/api/auth/signup",
    [validate({ body: schemas.signup }), verifySignUp.checkDuplicateUsernameOrEmail],
    controller.signup,
  );

  app.post("/api/auth/signin", validate({ body: schemas.signin }), controller.signin);

  app.post(
    "/api/auth/verify",
    validate({ body: schemas.verifyEmail }),
    controller.verify,
  );

  app.get("/api/auth/me", [authJwt.authAPIverifyToken], controller.authMe);

  app.post(
    "/api/auth/reset-password",
    validate({ body: schemas.resetPassword }),
    controller.resetPassword,
  );

  app.post(
    "/api/auth/confirm-reset-password",
    validate({ body: schemas.confirmResetPassword }),
    controller.confirmResetPassword,
  );

  app.get(
    "/api/auth/resend-verification",
    [authJwt.authAPIverifyToken],
    controller.resendVerification,
  );
};
