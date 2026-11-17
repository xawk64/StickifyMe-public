const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const { rateLimit } = require("express-rate-limit");
const { config } = require("./config");
const {
  createErrorHandler,
  notFoundHandler,
} = require("./http/middlewares/errorHandler");
const { logger } = require("./logger");
const { mailer } = require("./mail/mailer");
const { createServices } = require("./container");
const { requireAuth } = require("./http/middlewares/auth");
const { createAuthRouter } = require("./http/routes/auth.routes");
const { createProfileRouter } = require("./http/routes/profile.routes");
const { createHistoryRouter } = require("./http/routes/history.routes");

const LARGE_PAYLOAD_ROUTES = ["/api/barcodes/generate", "/api/barcodes-history/add"];

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

  // Only label endpoints carry sticker images; everything else gets a small limit.
  // body-parser skips requests that were already parsed, so order matters.
  app.use(LARGE_PAYLOAD_ROUTES, express.json({ limit: "50mb" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

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

  const services = options.services ?? createServices({ config, mailer });
  const auth = requireAuth(config.jwtSecret);

  app.use(createAuthRouter(services.auth, auth));
  app.use(createProfileRouter(services.profile, auth));
  app.use(createHistoryRouter(services.history, auth));
  require("./routes/barcodes.routes")(app);
  require("./routes/warehouses.routes")(app);
  require("./routes/support.routes")(app);
  require("./routes/telegram.routes")(app);
  app.get("/", (req, res) => {
    res.json({ message: "StickifyMe API" });
  });

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}

module.exports = { createApp };
