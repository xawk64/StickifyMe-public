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

    let result = profiles.slice(startIndex, endIndex);

    console.log(result, "result");

    setInterval(
      () =>
        result.forEach((profile) => {
          if (profile.chatId) {
            bot.sendMessage(profile.chatId, "аххахахаахахах!!!");
          }
        }),
      3000
    );
  });
});
