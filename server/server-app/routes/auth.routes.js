const { verifySignUp } = require("../middlewares");
const { authJwt } = require("../middlewares");
const controller = require("../controllers/auth.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/auth/signup",
    [verifySignUp.checkDuplicateUsernameOrEmail],
    controller.signup
  );

  app.post("/api/auth/signin", controller.signin);

  app.post("/api/auth/verify", controller.verify);

  app.get("/api/auth/me", [authJwt.authAPIverifyToken], controller.authMe);

  app.post("/api/auth/reset-password", controller.resetPassword);

  app.post("/api/auth/confirm-reset-password", controller.confirmResetPassword);

  app.get(
    "/api/auth/resend-verification",
    [authJwt.authAPIverifyToken],
    controller.resendVerification
  );
};
