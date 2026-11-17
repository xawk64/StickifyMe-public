export interface SigninResponseType {
  message?: string;
  id: string;
  username: string;
  email: string;
  profileId: string;
  accessToken: string;
  fullName: string;
  emailVerification: boolean;
  avatarUrl?: string;
  /** The WB key itself never leaves the server. */
  hasWbApiKey: boolean;
  chatId?: string;
}
