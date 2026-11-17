const crypto = require("crypto");
const { db } = require("../models");
const { hashToken } = require("../utils/tokens");
const { NotFoundError } = require("../errors");

const User = db.user;
const Profile = db.profile;

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

/**
 * Issues a one-time token for https://t.me/<bot>?start=<token>.
 * Only its hash is stored; the bot links the chat that presents the token.
 */
exports.createLinkToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }
    const token = crypto.randomBytes(24).toString("base64url");
    await Profile.updateOne(
      { _id: user.profileId },
      {
        telegramLinkTokenHash: hashToken(token),
        telegramLinkTokenExpires: new Date(Date.now() + LINK_TOKEN_TTL_MS),
      },
    );
    return res.status(200).send({ token });
  } catch (err) {
    return next(err);
  }
};
