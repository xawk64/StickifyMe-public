const { requireAuth } = require("../http/middlewares/auth");
const { config } = require("../config");

const authJwt = { authAPIverifyToken: requireAuth(config.jwtSecret) };

module.exports = { authJwt };
