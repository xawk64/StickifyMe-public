const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const mongodb = require("mongodb");

var corsOptions = {
  origin: "http://localhost:3000",
};

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: "50mb" }));

app.use(bodyParser.urlencoded({ extended: true }));

const client = mongodb.MongoClient;

const db = require("./server-app/models");

client.connect("mongodb://localhost:27017/auth", function (err, db) {
  if (err) {
    console.log("database is not connected");
  } else {
    console.log("connected!!");
  }
});

db.mongoose
  .connect(`mongodb://localhost:27017/auth`, {
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

app.get("/", (req, res) => {
  res.json({ message: "StickifyMe API" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
