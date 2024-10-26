const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const mongodb = require("mongodb");
const fileUpload = require("express-fileupload");

const db = require("./server-app/models");
const WarehouseCheckerService = require("./server-app/services/warehousesMonitoringService");

var corsOptions = {
  origin: "http://localhost:3000",
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
        res.status(400).json({ error: "Invalid JSON" });
        throw new Error("Invalid JSON");
      }
    },
  })
);

app.use(bodyParser.urlencoded({ extended: true }));

const client = mongodb.MongoClient;

client.connect(process.env.MONGO_URI, function (err, db) {
  if (err) {
    console.log("database is not connected");
  } else {
    console.log("connected!!");
  }
});

db.mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
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

process.on("SIGINT", () => {
  WarehouseCheckerService.stopAllChecks();
  process.exit(0);
});
