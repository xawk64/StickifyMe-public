const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const { config } = require("../config");
const db = require("../models");
const { notifyAdmin, sendTemplate } = require("../utils/sendEmail");
const templates = require("../emails/templates");
const { hashPassword, verifyPassword } = require("../utils/password");
const { hashToken } = require("../utils/tokens");
const { NotFoundError, UnauthorizedError } = require("../errors");

const User = db.user;
const Profile = db.profile;
const WarehouseSettings = db.warehouseSettings;
const Warehouses = db.warehouse;

const DUPLICATE_KEY_ERROR = 11000;
const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const INVALID_CREDENTIALS = "Неверный логин или пароль";
const RESET_PASSWORD_SENT =
  "Если такой email зарегистрирован, мы отправили на него инструкции по сбросу пароля.";

const toUserResponse = (user, profile) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  profileId: user.profileId,
  fullName: profile?.fullName,
  avatarUrl: profile?.avatarUrl,
  wbApiKey: profile?.wbApiKey,
  chatId: profile?.chatId,
  emailVerification: user.emailVerification,
});

exports.signup = async (req, res) => {
  const createdDocuments = [];
  try {
    const profile = await Profile.create({ fullName: req.body.username });
    createdDocuments.push(profile);
    createdDocuments.push(
      ...(await Promise.all([
        Warehouses.create({ items: [], userProfileId: profile._id }),
        WarehouseSettings.create({
          items: [],
          userProfileId: profile._id,
          enabled: true,
        }),
      ])),
    );
    await User.create({
      username: req.body.username,
      email: req.body.email,
      password: await hashPassword(req.body.password),
      emailVerification: true,
      emailVerificationHash: randomUUID(),
      profileId: profile._id,
    });
  } catch (err) {
    // MongoDB standalone has no multi-document transactions: compensate manually.
    await Promise.allSettled(createdDocuments.map((doc) => doc.deleteOne()));
    if (err.code === DUPLICATE_KEY_ERROR) {
      return res
        .status(400)
        .send({ message: "Имя пользователя или email уже используется!" });
    }
    console.error("Signup failed:", err);
    return res.status(500).send({ message: "Не удалось зарегистрировать пользователя" });
  }

  notifyAdmin(
    templates.adminNewSignup({ email: req.body.email, username: req.body.username }),
  );
  sendTemplate(
    req.body.email,
    templates.welcome({ username: req.body.username, appUrl: config.appUrl }),
  );

  return res.status(200).send({
    message: "Пользователь успешно зарегистрирован!",
  });
};

exports.signin = async (req, res, next) => {
  try {
    const user = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.username }],
    });
    // verifyPassword runs bcrypt even without a user to keep the timing uniform
    const passwordIsValid = await verifyPassword(req.body.password, user?.password);
    if (!user || !passwordIsValid) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    const accessToken = jwt.sign({ id: user.id }, config.jwtSecret, {
      expiresIn: TOKEN_TTL_SECONDS,
    });
    const profile = await Profile.findById(user.profileId);
    return res.status(200).send({ ...toUserResponse(user, profile), accessToken });
  } catch (err) {
    return next(err);
  }
};

exports.authMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new NotFoundError("Пользователь не найден.");
    }
    const profile = await Profile.findById(user.profileId);
    return res.status(200).send(toUserResponse(user, profile));
  } catch (err) {
    return next(err);
  }
};

exports.verify = async (req, res, next) => {
  try {
    const result = await User.updateOne(
      { emailVerificationHash: req.body.hash },
      { emailVerification: true },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundError("Пользователь для подтверждения почты не найден.");
    }
    return res.status(200).send({ emailVerification: true });
  } catch (err) {
    return next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const resetToken = randomUUID();
      user.resetPasswordToken = hashToken(resetToken);
      user.resetPasswordExpires = Date.now() + RESET_TOKEN_TTL_MS;
      await user.save();

      const profile = await Profile.findById(user.profileId);
      await sendTemplate(
        user.email,
        templates.passwordReset({
          name: profile?.fullName || user.username,
          link: `${config.appUrl}/reset-password?token=${resetToken}`,
        }),
      );
    }
    // Same answer whether or not the email exists: no account enumeration.
    return res.status(200).send({ message: RESET_PASSWORD_SENT });
  } catch (err) {
    return next(err);
  }
};

exports.confirmResetPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: hashToken(req.body.token),
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .send({ message: "Токен для сброса пароля недействителен или истек." });
    }

    user.password = await hashPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).send({ message: "Пароль успешно изменен." });
  } catch (err) {
    return next(err);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }
    if (user.emailVerification) {
      return res.status(400).send({ message: "Email уже подтвержден" });
    }

    await sendTemplate(
      user.email,
      templates.verificationReminder({
        username: user.username,
        link: `${config.appUrl}/verify/?hash=${user.emailVerificationHash}`,
      }),
    );

    return res.status(200).send({
      message: "Письмо для подтверждения отправлено на вашу почту",
    });
  } catch (err) {
    return next(err);
  }
};
