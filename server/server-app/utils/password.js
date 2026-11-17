const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = 12;

// Hash compared against when the user does not exist, so that a missing
// account takes as long to reject as a wrong password (no timing oracle).
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

const verifyPassword = (password, hash) => bcrypt.compare(password, hash || DUMMY_HASH);

module.exports = { BCRYPT_ROUNDS, hashPassword, verifyPassword };
