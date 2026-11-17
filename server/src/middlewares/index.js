const { requireAuth } = require("../http/middlewares/auth");
const { config } = require("../config");
const verifySignUp = require("./verifySignUp");

const authJwt = { authAPIverifyToken: requireAuth(config.jwtSecret) };

module.exports = { authJwt, verifySignUp };
