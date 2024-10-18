const db = require("../models");
const Profile = db.profile;
const User = db.user;
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { log } = require("console");

exports.setProfile = (req, res) => {
  console.log(req.body);
  User.findById(req.userId, (err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    const profile = {
      ...req.body,
    };

    Profile.updateOne(
      { _id: user.profileId },
      profile,
      { upsert: false },
      (err) => {
        if (err) {
          res.status(500).send({ message: err });
        }
      }
    );
    res.status(200).send("was success!");
  });
};

exports.getProfiles = (req, res) => {
  if (req.query.page > -1) {
    User.findById(req.userId, (err, user) => {
      if (err) {
        res.status(500).send({ message: err });
      }

      Profile.findById(user.profileId, (err, userProfile) => {
        if (err) {
          res.status(500).send({ message: err });
        }

        Profile.find((err, profiles) => {
          if (err) {
            res.status(500).send({ message: err });
          }

          let limit = req.query.limit;
          let page = req.query.page;

          let startIndex = (page - 1) * limit;
          let endIndex = page * limit;

          let profilesWithoutAuthProfile = profiles.filter(
            (profile) => String(profile._id) !== String(userProfile._id)
          );

          let result = profilesWithoutAuthProfile.slice(startIndex, endIndex);

          res.status(200).json({ users: result, usersCount: profiles.length });
        });
      });
    });
  }

  if (req.params.profileId === "my") {
    User.findById(req.userId, (err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      Profile.findById(user.profileId, (err, profile) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        res.status(200).json({ profile });
      });
    });
  }

  if (req.params.profileId.length > 10) {
    Profile.findById(req.params.profileId, (err, profile) => {
      if (err) {
        res.status(500).send({ message: err });
      }
      res.status(200).json({ profile });
    });
  }
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
    `${userId}_${avatarFile.name}`
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
        }
      );
    });

    res.send({ avatarUrl });
  });
};
