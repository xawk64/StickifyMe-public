const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Profile = db.profile;
const WarehouseSettings = db.warehouseSettings;
const Warehouses = db.warehouse;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const { sendEmail } = require("../utils/sendEmail");
const { v4: uuidv4 } = require("uuid");

exports.signup = (req, res) => {
  const emailVerificationHash = uuidv4();
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    emailVerification: false,
    emailVerificationHash,
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    console.log("userName", req.body.username);

    const profile = new Profile({
      fullName: req.body.username,
    });

    profile.save((err) => {
      if (err) {
        res.status(500).send({ message: err });
      }
    });

    user.profileId = profile._id;

    const warehouse = new Warehouses({
      items: [],
      userProfileId: user.profileId,
    });

    warehouse.save((err) => {
      if (err) {
        res.status(500).send({ message: err });
      }
    });

    const warehouseSettings = new WarehouseSettings({
      items: [],
      userProfileId: user.profileId,
      enabled: true,
    });

    warehouseSettings.save((err) => {
      if (err) {
        res.status(500).send({ message: err });
      }
    });

    user.save((err) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      sendEmail(
        req.body.email,
        "Потверждение учетной записи",
        `Добрый день, ${req.body.username}! <br />Вы зарегистрировались на сервисе example.com. Для подтверждения почты перейдите по ссылке: https:/example.com/verify/?hash=${emailVerificationHash} <br />Если это делали не Вы, просьба закрыть данное сообщение. `
      );

      res.status(200).send({
        message:
          "Пользователь успешно зарегистрирован! Информация для подтверждения отправлена на ваш email!",
      });
    });
  });
};

exports.signin = (req, res) => {
  User.findOne({
    username: req.body.username,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден." });
    }

    let passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Неправильный пароль!",
      });
    }

    let token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: 2592000, // 30 days
    });
    console.log(user.profileId);

    Profile.find((err, profile) => {
      if (err) {
        res.status(500).send({ message: err });
      }

      console.log(profile);
    });

    Profile.findOne({ _id: user.profileId }).exec((err, profile) => {
      console.log(profile);
      if (err) {
        return res.status(500).send({ message: err });
      }
      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        profileId: user.profileId,
        fullName: profile.fullName,
        accessToken: token,
        avatarUrl: profile.avatarUrl,
        wbApiKey: profile.wbApiKey,
        chatId: profile.chatId,
      });
    });
  });
};

exports.authMe = (req, res) => {
  User.findById(req.userId, (err, user) => {
    if (err) {
      res.status(200).send({ message: err });
    }

    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден." });
    }

    Profile.findOne({ _id: user.profileId }).exec((err, profile) => {
      console.log(profile);
      if (err) {
        return res.status(500).send({ message: err });
      }
      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        profileId: user.profileId,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        wbApiKey: profile.wbApiKey,
        chatId: profile.chatId,
        emailVerification: user.emailVerification,
      });
    });
  });
};

exports.verify = (req, res) => {
  User.findOne({ emailVerificationHash: req.body.hash }, (err, user) => {
    if (err) {
      res.status(200).send({ emailVerification: false });
    }
    if (!user) {
      return res
        .status(404)
        .send({ message: "Пользователь для подтверждения пароля не найден." });
    }

    User.updateOne(
      { _id: user._id },
      { emailVerification: true },
      { upsert: false },
      (err) => {
        if (err) {
          res.status(500).send({ message: err });
        }
      }
    );

    res.status(200).send({
      emailVerification: true,
    });
  });
};

exports.resetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .send({ message: "Пользователь с таким email не найден." });
    }

    const profile = await Profile.findOne({ _id: user.profileId });
    if (!user) {
      return res
        .status(404)
        .send({ message: "Пользователь с таким email не найден." });
    }

    const resetToken = uuidv4();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 час
    await user.save();

    // Отправка email с инструкциями по сбросу пароля
    await sendEmail(
      email,
      "Сброс пароля",
      `Добрый день, ${profile.fullName}! Для сброса пароля перейдите по ссылке:  https://example.com/reset-password?token=${resetToken}`
    );

    res.status(200).send({
      message: "Инструкции по сбросу пароля отправлены на ваш email.",
    });
  } catch (error) {
    console.error("Ошибка при сбросе пароля:", error);
    res
      .status(500)
      .send({ message: "Произошла ошибка при обработке запроса." });
  }
};

exports.confirmResetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .send({ message: "Токен для сброса пароля недействителен или истек." });
    }

    user.password = bcrypt.hashSync(password, 8);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).send({ message: "Пароль успешно изменен." });
  } catch (error) {
    console.error("Ошибка при подтверждении сброса пароля:", error);
    res
      .status(500)
      .send({ message: "Произошла ошибка при обработке запроса." });
  }
};
