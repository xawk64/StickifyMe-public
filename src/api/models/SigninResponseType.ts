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
  wbApiKey?: string;
  chatId?: string;
}
