const db = require("../models");
const Profile = db.profile;
const User = db.user;
const path = require("path");

exports.setProfile = async (req, res) => {
  User.findById(req.userId, async (err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    const profile = {
      ...req.body,
    };

    try {
      await Profile.updateOne(
        { _id: user.profileId },
        profile,
        { upsert: false },
        (err) => {
          if (err) {
            res.status(500).send({ message: err });
          }
        },
      );

      res.status(200).send({ message: "was success!" });
    } catch (err) {
      res.status(500).send({ message: err });
    }
  });
};

exports.uploadAvatar = async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const avatarFile = req.files.avatar;
  const userId = req.userId; // Предполагается, что у вас есть middleware для аутентификации

  const uploadPath = path.join(
    __dirname,
    "../../uploads/avatars",
    `${userId}_${avatarFile.name}`,
  );

  avatarFile.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }

    const avatarUrl = `/uploads/avatars/${userId}_${avatarFile.name}`;

    User.findById(req.userId, (err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      Profile.updateOne(
        { _id: user.profileId },
        { avatarUrl },
        { upsert: false },
        (err) => {
          if (err) {
            res.status(500).send({ message: err });
          }
        },
      );
    });

    res.send({ avatarUrl });
  });
};
