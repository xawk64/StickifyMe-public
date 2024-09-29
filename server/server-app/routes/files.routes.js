const { authJwt } = require("../middlewares");
const fileController = require("../controllers/fileController");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get(
    "/api/files/createDir",
    [authJwt.authAPIverifyToken],
    fileController.createDir
  );
  app.get(
    "/api/files/upload",
    [authJwt.authAPIverifyToken],
    fileController.uploadFile
  );
  app.get(
    "/api/files/get",
    [authJwt.authAPIverifyToken],
    fileController.getFiles
  );
};

module.exports = router;
