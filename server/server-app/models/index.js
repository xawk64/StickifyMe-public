const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.profile = require("./profile.model");
db.barcodesHistory = require("./barcodesHistory.model");
db.order = require("./order.model");
db.product = require("./product.model");

module.exports = db;
