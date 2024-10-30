const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const mongodb = require("mongodb");
const fileUpload = require("express-fileupload");

const db = require("./server-app/models");
const WarehouseCheckerService = require("./server-app/services/warehousesMonitoringService");

// Function to log errors
function logError(message) {
  console.error(message);
  fs.appendFileSync("/tmp/server_error.log", message + "\n");
}

// Error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
  logError(`Uncaught Exception: ${error.stack}`);
  sendEmail(
    "admin@example.com",
    "Uncaught Exception in Server",
    `An uncaught exception occurred: ${error.stack}`
  );
  gracefulShutdown(1);
});

// Error handling for unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logError(
    `Unhandled Rejection at: ${util.inspect(promise)}\nReason: ${reason}`
  );
  sendEmail(
    "admin@example.com",
    "Unhandled Rejection in Server",
    `An unhandled rejection occurred: ${reason}`
  );
  gracefulShutdown(1);
});

// Graceful shutdown function
function gracefulShutdown(exitCode) {
  console.log("Shutting down gracefully...");
  // Close database connections, stop services, etc.
  WarehouseCheckerService.stopAllChecks();

  // Close the Express server
  server.close(() => {
    console.log("Server closed");
    process.exit(exitCode);
  });

  // If server hasn't closed in 10 seconds, force shutdown
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(exitCode);
  }, 10000);
}

// ... rest of the existing code ...

// Redirect console.log and console.error to also write to files
const originalConsoleLog = console.log;
console.log = function () {
  fs.appendFileSync(
    "/tmp/server.log",
    util.format.apply(null, arguments) + "\n"
  );
  originalConsoleLog.apply(console, arguments);
};

const originalConsoleError = console.error;
console.error = function () {
  fs.appendFileSync(
    "/tmp/server_error.log",
    util.format.apply(null, arguments) + "\n"
  );
  originalConsoleError.apply(console, arguments);
};

var corsOptions = {
  origin: ["http://localhost:3000", "https://example.com:403"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use("/uploads", express.static("./uploads"));

app.use(
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 МБ максимальный размер файла
    },
  })
);

app.use(
  bodyParser.json({
    limit: "50mb",
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({ message: "Ошибка JSON" });
        throw new Error("Invalid JSON");
      }
    },
  })
);

app.use(bodyParser.urlencoded({ extended: true }));

const MONGO_USERNAME = process.env.MONGO_USERNAME;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;

const MONGO_URI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${process.env.MONGO_URI}:27017/stickifyme?authSource=admin`;

const client = mongodb.MongoClient;

client.connect(MONGO_URI, function (err, db) {
  if (err) {
    console.log("database is not connected");
    console.error(err);
  } else {
    console.log("connected!!");
  }
});

db.mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connect to MongoDB. ");
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });

require("./server-app/routes/auth.routes")(app);
require("./server-app/routes/user.routes")(app);
require("./server-app/routes/barcodesHistory.routes")(app);
require("./server-app/routes/barcodes.routes")(app);
require("./server-app/routes/warehouses.routes")(app);

app.get("/", (req, res) => {
  res.json({ message: "StickifyMe API" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  WarehouseCheckerService.initialize();
});

process.on("SIGTERM", () => gracefulShutdown(0));
process.on("SIGINT", () => gracefulShutdown(0));
