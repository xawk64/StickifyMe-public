const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const { rateLimit } = require("express-rate-limit");
const config = require("./config");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const AUTH_ROUTES = [
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/reset-password",
  "/api/auth/confirm-reset-password",
];

function createApp(options = {}) {
  const app = express();
  app.set("trust proxy", config.trustProxy);

  app.use(cors({ origin: config.corsOrigins, credentials: true }));

  app.use(
    "/uploads",
    express.static(config.uploadsDir, {
      setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
    }),
  );

  app.use(
    fileUpload({
      createParentPath: true,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50 МБ максимальный размер файла
      },
    }),
  );

  app.use(
    bodyParser.json({
      limit: "50mb",
    }),
  );

  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(
    AUTH_ROUTES,
    rateLimit({
      ...config.authRateLimit,
      ...options.authRateLimit,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { message: "Слишком много попыток, попробуйте позже" },
    }),
  );

  require("./routes/auth.routes")(app);
  require("./routes/user.routes")(app);
  require("./routes/barcodesHistory.routes")(app);
  require("./routes/barcodes.routes")(app);
  require("./routes/warehouses.routes")(app);
  require("./routes/support.routes")(app);
  app.get("/", (req, res) => {
    res.json({ message: "StickifyMe API" });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
