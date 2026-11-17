const { config } = require("./config");
const { createApp } = require("./app");
const { notifyAdmin, mailer } = require("./mail/mailer");
const templates = require("./mail/templates");
const { db } = require("./models");
const WarehouseCheckerService = require("./services/warehousesMonitoringService");

const SHUTDOWN_TIMEOUT_MS = 10000;

const app = createApp();
let httpServer = null;
let isShuttingDown = false;

async function notifyAdminAboutCrash(subject, details) {
  try {
    await notifyAdmin(templates.adminCrash({ title: subject, details }));
  } catch (emailError) {
    console.error("Failed to send error email:", emailError);
  }
}

async function gracefulShutdown(exitCode) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log("Shutting down gracefully...");

  const forceExit = setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down");
    process.exit(exitCode);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    WarehouseCheckerService.stopAllChecks();
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
      console.log("HTTP server closed");
    }
    await db.mongoose.disconnect();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error during shutdown:", error);
  } finally {
    process.exit(exitCode);
  }
}

process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  await notifyAdminAboutCrash(
    "Uncaught Exception in Server",
    `An uncaught exception occurred: ${error.stack}`,
  );
  gracefulShutdown(1);
});

process.on("unhandledRejection", async (reason) => {
  console.error("Unhandled Rejection:", reason);
  await notifyAdminAboutCrash(
    "Unhandled Rejection in Server",
    `An unhandled rejection occurred: ${reason}`,
  );
  gracefulShutdown(1);
});

process.on("SIGTERM", () => gracefulShutdown(0));
process.on("SIGINT", () => gracefulShutdown(0));

db.mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log("Successfully connected to MongoDB");
    // Start accepting requests only after the database is reachable
    httpServer = app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
      WarehouseCheckerService.initialize();
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

mailer.verify();
