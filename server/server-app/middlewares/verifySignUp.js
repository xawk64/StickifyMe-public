const db = require("../models");
const User = db.user;

const checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Username
  console.log(req.body);
  User.findOne({
    username: req.body.username,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (user) {
      console.log(user);

      res.status(400).send({ error: "Имя пользователя уже используется!" });
      return;
    }

    // Email
    User.findOne({
      email: req.body.email,
    }).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (user) {
        User.deleteOne({ email: user.email }).exec((err, user) => {
          console.log("esdsadsa", user, err);
        });
        res.status(400).send({ error: "Email уже используется!" });

        return;
      }

      next();
    });
  });
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
};

module.exports = verifySignUp;
