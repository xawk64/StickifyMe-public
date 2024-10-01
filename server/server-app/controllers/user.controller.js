const db = require("../models");
const Profile = db.profile;
const User = db.user;
const mongoose = require("mongoose");

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
