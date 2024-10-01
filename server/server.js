const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const mongodb = require("mongodb");
const TelegramBot = require("node-telegram-bot-api");
const token = "***REMOVED***"; // Replace with your own bot token
const controller = require("./server-app/controllers/user.controller");

const db = require("./server-app/models");
const Profile = db.profile;
const User = db.user;
const Warehouses = db.warehouse;
const WarehouseSettings = db.warehouseSettings;

const tokenWB =
  "***REMOVED***";

var corsOptions = {
  origin: "http://localhost:3000",
};

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: "50mb" }));

app.use(bodyParser.urlencoded({ extended: true }));

const client = mongodb.MongoClient;

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
require("./server-app/routes/warehouses.routes")(app);

app.get("/", (req, res) => {
  res.json({ message: "StickifyMe API" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);

  const bot = new TelegramBot(token, { polling: true });

  bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    console.log(chatId, messageText, "messageText");

    if (messageText.includes("/start")) {
      const userId = messageText.split("/start ")?.[1];

      console.log(userId, "userId");
      if (userId) {
        User.findById(userId, (err, user) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          const profile = {
            chatId,
          };

          Profile.updateOne(
            { _id: user.profileId },
            profile,
            { upsert: false },
            (err) => {
              if (err) {
                res.status(500).send({ message: err });
              }
            }
          );
        });

        bot.sendMessage(chatId, "Welcome to the bot!, " + userId);
      }
    }
  });

  Profile.find((err, profiles) => {
    let limit = 10;
    let page = 1;

    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;

    profiles = profiles.slice(startIndex, endIndex);

    profiles.forEach((profile) => {
      WarehouseSettings.find(
        { userProfileId: profile._id },
        async (err, settings) => {
          if (settings[2]?.items?.length && profile.chatId) {
            setInterval(() => {
              Warehouses.find(
                { userProfileId: profile._id },
                async (err, warehouses) => {
                  console.log(warehouses, "warehouses");
                  const warehouseInfoById = {};
                  const warehouseSettingsById = {};
                  console.log(JSON.stringify(settings[2].items), "items");
                  let warehouseIDs = settings[2].items.map((item) => {
                    warehouseSettingsById[item.ID] = item;
                    return `warehouseIDs=${item.ID}`;
                  });
                  warehouseIDs = warehouseIDs.join("&");
                  console.log(warehouseIDs, "warehouseIDs");
                  const warehousesItemsResponse = await fetch(
                    `https://supplies-api.wildberries.ru/api/v1/acceptance/coefficients?${warehouseIDs}`,
                    {
                      headers: {
                        accept: "application/json",
                        ["Content-Type"]: "application/json",
                        Authorization: tokenWB,
                      },
                    }
                  );
                  const warehousesItems = await warehousesItemsResponse.json();

                  console.log(warehousesItems, "warehousesItems");
                  warehouses[0].items.forEach(
                    (warehouse) =>
                      (warehouseInfoById[warehouse.warehouseID] = warehouse)
                  );
                  const filteredWarehouseItems = warehousesItems.filter(
                    (item) => {
                      const settings = warehouseSettingsById[item.warehouseID];
                      const oldInfo = warehouseInfoById[item.warehouseID];
                      return (
                        item.coefficient > -1 &&
                        Date(item.date) >= Date(settings.startDate) &&
                        Date(item.date) <= Date(settings.endDate) &&
                        settings.boxTypes.includes(item.boxTypeName) &&
                        item.coefficient <= settings.coeff &&
                        (oldInfo
                          ? item.coefficient < oldInfo.coefficient
                          : true)
                      );
                    }
                  );
                  const warehouseInfo = {
                    items: filteredWarehouseItems,
                    userProfileId: profile.id,
                  };
                  filteredWarehouseItems.forEach((item) =>
                    bot.sendMessage(
                      profile.chatId,
                      `Склад ${item.warehouseName}, дата поставки: ${
                        item.date
                      }, тип упаковки: ${item.boxTypeName}, коэфициент: ${
                        item.coefficient === 0
                          ? "бесплатно"
                          : `x${item.coefficient}`
                      }`
                    )
                  );
                  console.log(warehouseInfo, filteredWarehouseItems, "items!");

                  if (filteredWarehouseItems.length) {
                    Warehouses.updateOne(
                      { userProfileId: profile.id },
                      warehouseInfo,
                      { upsert: false },
                      (err) => {
                        if (err) {
                          res.status(500).send({ message: err });
                        }
                      }
                    );
                  }
                }
              );
            }, 15000);
          }
        }
      );
    });
  });

  WarehouseSettings.find((err, settings) => {
    console.log(settings, "settings");
  });

  db.warehouse.find((err, settings) => {
    console.log(settings, "warehouse");
  });
});
