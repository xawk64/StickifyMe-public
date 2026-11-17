const db = require("../models");
const Profile = db.profile;
const User = db.user;
const path = require("path");
const { randomUUID } = require("crypto");
const { config } = require("../config");
const { detectImageExtension } = require("../utils/imageType");

exports.setProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден" });
    }
    // req.body is already reduced to whitelisted fields by the validation schema
    await Profile.updateOne({ _id: user.profileId }, req.body);
    return res.status(200).send({ message: "was success!" });
  } catch (err) {
    return next(err);
  }
};

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

exports.uploadAvatar = async (req, res) => {
  const avatarFile = req.files?.avatar;
  if (!avatarFile || Array.isArray(avatarFile)) {
    return res.status(400).send({ message: "Файл не загружен" });
  }
  if (avatarFile.size > AVATAR_MAX_BYTES) {
    return res.status(413).send({ message: "Файл слишком большой (максимум 2 МБ)" });
  }
  const extension = detectImageExtension(avatarFile.data);
  if (!extension) {
    return res
      .status(400)
      .send({ message: "Допустимы только изображения PNG, JPEG или WebP" });
  }

  // The file name is generated on the server: the client name is never used in the path.
  const fileName = `${req.userId}-${randomUUID()}.${extension}`;
  const avatarUrl = `/uploads/avatars/${fileName}`;

  try {
    await avatarFile.mv(path.join(config.uploadsDir, "avatars", fileName));
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден" });
    }
    await Profile.updateOne({ _id: user.profileId }, { avatarUrl });
    return res.send({ avatarUrl });
  } catch (err) {
    console.error("Avatar upload failed:", err);
    return res.status(500).send({ message: "Не удалось сохранить аватар" });
  }
};
