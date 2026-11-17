import { asyncHandler } from "../asyncHandler";
import { currentUserId } from "../middlewares/auth";
import type { AuthService, UserWithProfile } from "../../services/auth.service";

/** Shape of the user object the web client expects (kept as before the refactoring). */
export const toUserResponse = ({ user, profile }: UserWithProfile) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  profileId: user.profileId,
  fullName: profile?.fullName,
  avatarUrl: profile?.avatarUrl,
  // the key itself never leaves the server
  hasWbApiKey: Boolean(profile?.wbApiKeyEncrypted),
  chatId: profile?.chatId,
  emailVerification: user.emailVerification,
});

export function createAuthController(auth: AuthService) {
  return {
    signup: asyncHandler(async (req, res) => {
      await auth.signup(req.body);
      res.status(200).send({ message: "Пользователь успешно зарегистрирован!" });
    }),

    signin: asyncHandler(async (req, res) => {
      const result = await auth.signin(req.body.username, req.body.password);
      res
        .status(200)
        .send({ ...toUserResponse(result), accessToken: result.accessToken });
    }),

    me: asyncHandler(async (req, res) => {
      res.status(200).send(toUserResponse(await auth.me(currentUserId(req))));
    }),

    verify: asyncHandler(async (req, res) => {
      await auth.verifyEmail(req.body.hash);
      res.status(200).send({ emailVerification: true });
    }),

    resetPassword: asyncHandler(async (req, res) => {
      await auth.requestPasswordReset(req.body.email);
      res.status(200).send({
        message:
          "Если такой email зарегистрирован, мы отправили на него инструкции по сбросу пароля.",
      });
    }),

    confirmResetPassword: asyncHandler(async (req, res) => {
      await auth.confirmPasswordReset(req.body.token, req.body.password);
      res.status(200).send({ message: "Пароль успешно изменен." });
    }),

    resendVerification: asyncHandler(async (req, res) => {
      await auth.resendVerification(currentUserId(req));
      res
        .status(200)
        .send({ message: "Письмо для подтверждения отправлено на вашу почту" });
    }),
  };
}
