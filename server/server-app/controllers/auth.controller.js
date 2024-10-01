const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Profile = db.profile;
const WarehouseSettings = db.warehouseSettings;
const Warehouses = db.warehouse;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const { sendEmail } = require("../utils/sendEmail");
var bcrypt = require("bcryptjs");
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

      sendEmail(req.body.email, req.body.username, emailVerificationHash);

      res.status(200).send({ message: "User was registered successfully!" });
    });
  });
};

exports.signin = (req, res) => {
  User.findOne({
    username: req.body.username,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ error: err });
      return;
    }

    if (!user) {
      return res.status(404).send({ error: "User Not found." });
    }

    let passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        error: "Invalid Password!",
      });
    }

    let token = jwt.sign({ id: user.id }, config.secret, {
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
      });
    });
  });
};

exports.authMe = (req, res) => {
  User.findById(req.userId, (err, user) => {
    if (err) {
      res.status(200).send({ message: err });
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
      });
    });
  });
};

exports.verify = (req, res) => {
  User.findOne({ emailVerificationHash: req.body.hash }, (err, user) => {
    if (err) {
      res.status(200).send({ emailVerification: false });
    }
    console.log(user.username);

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
