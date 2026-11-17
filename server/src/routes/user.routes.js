const { authJwt } = require("../middlewares");
const controller = require("../controllers/user.controller");
const { uploadAvatar } = require("../controllers/user.controller");
const { validate } = require("../http/middlewares/validate");
const schemas = require("../validation/profile.schemas");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept",
    );
    next();
  });

  app.post(
    "/api/profile/",
    [authJwt.authAPIverifyToken, validate({ body: schemas.updateProfile })],
    controller.setProfile,
  );

  app.post("/api/upload-avatar", [authJwt.authAPIverifyToken], uploadAvatar);
};
