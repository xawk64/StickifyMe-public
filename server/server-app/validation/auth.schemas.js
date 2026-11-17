const { z } = require("zod");

const email = z.email().max(254);
const password = z.string().min(8).max(128);

const signup = z.object({
  username: z.string().trim().min(2).max(50),
  email,
  password,
});

const signin = z.object({
  // the web app sends either a username or an email in this field
  username: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(128),
});

const verifyEmail = z.object({ hash: z.uuid() });

const resetPassword = z.object({ email });

const confirmResetPassword = z.object({ token: z.uuid(), password });

module.exports = { signup, signin, verifyEmail, resetPassword, confirmResetPassword };
