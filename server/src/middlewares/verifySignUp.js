const { db } = require("../models");

const User = db.user;

// Friendly early check; uniqueness itself is guaranteed by the unique indexes.
const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    if (await User.exists({ username: req.body.username })) {
      return res.status(400).send({ message: "Имя пользователя уже используется!" });
    }
    if (await User.exists({ email: req.body.email })) {
      return res.status(400).send({ message: "Email уже используется!" });
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { checkDuplicateUsernameOrEmail };
