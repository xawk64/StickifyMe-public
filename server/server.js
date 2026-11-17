const config = require("./server-app/config");
const { createApp } = require("./server-app/app");
const app = createApp();
const mongodb = require("mongodb");
const fs = require("fs");
const { sendEmail, verifyMailTransport } = require("./server-app/utils/sendEmail");

const db = require("./server-app/models");
const WarehouseCheckerService = require("./server-app/services/warehousesMonitoringService");

// Function to log errors
function logError(message) {
  console.error(message);
  fs.appendFileSync("/tmp/server_error.log", message + "\n");
}


// Error handling for uncaught exceptions
process.on("uncaughtException", async (error) => {
  if (config.nodeEnv === "production") {
    logError(`Uncaught Exception: ${error.stack}`);
    try {
      await sendEmail(
        config.adminEmail,
        "Uncaught Exception in Server",
        `An uncaught exception occurred: ${error.stack}`
      );
    } catch (emailError) {
      console.error("Failed to send error email:", emailError);
    }
    gracefulShutdown(1);
  }
});

// Error handling for unhandled promise rejections
process.on("unhandledRejection", async (reason, promise) => {
  if (config.nodeEnv === "production") {
    logError(`Unhandled Rejection at: ${reason}`);
    try {
      await sendEmail(
        config.adminEmail,
        "Unhandled Rejection in Server",
        `An unhandled rejection occurred: ${reason}`
      );
    } catch (emailError) {
      console.error("Failed to send error email:", emailError);
    }
    gracefulShutdown(1);
  }
});

// Graceful shutdown function
function gracefulShutdown(exitCode) {
  console.log("Shutting down gracefully...");
  try {
    // Close database connections, stop services, etc.
    if (
      WarehouseCheckerService &&
      typeof WarehouseCheckerService.stopAllChecks === "function"
    ) {
      WarehouseCheckerService.stopAllChecks();
    }

    // Close the Express server
    if (app && typeof app.close === "function") {
      app.close(() => {
        console.log("Server closed");
        process.exit(exitCode);
      });
    } else {
      console.log("Server already closed or not initialized");
      process.exit(exitCode);
    }

    // If server hasn't closed in 10 seconds, force shutdown
    setTimeout(() => {
      console.error(
        "Could not close connections in time, forcefully shutting down"
      );
      process.exit(exitCode);
    }, 10000);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(exitCode);
  }
}

const MONGO_URI = config.mongoUri;
const PORT = config.port;

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
    // Запускаем сервер только после успешного подключения к БД
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
      // Инициализируем сервис только один раз здесь
      WarehouseCheckerService.initialize();
    });
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });

verifyMailTransport();

process.on("SIGTERM", () => gracefulShutdown(0));
process.on("SIGINT", () => gracefulShutdown(0));
