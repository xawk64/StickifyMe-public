const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const config = require("./config");

function createApp() {
  const app = express();

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

  require("./routes/auth.routes")(app);
  require("./routes/user.routes")(app);
  require("./routes/barcodesHistory.routes")(app);
  require("./routes/barcodes.routes")(app);
  require("./routes/warehouses.routes")(app);
  require("./routes/support.routes")(app);
  app.get("/", (req, res) => {
    res.json({ message: "StickifyMe API" });
  });

  return app;
}

module.exports = { createApp };
