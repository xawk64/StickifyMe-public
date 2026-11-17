const crypto = require("crypto");

/** One-way hash for single-use tokens stored in the database. */
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = { hashToken };
