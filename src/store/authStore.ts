import { makeAutoObservable } from "mobx";
import { Store } from ".";
import { SigninResponseType } from "../api/models/SigninResponseType";
import { RequestStatus } from "./enums";

export class AuthStore {
  Store;
  state: SigninResponseType = {
    id: "",
    username: "",
    email: "",
    profileId: "",
    fullName: "",
    accessToken: "",
    emailVerification: false,
    hasWbApiKey: false,
    chatId: "",
  };
  status: RequestStatus = RequestStatus.idle;

  constructor(store: Store) {
    this.Store = store;
    makeAutoObservable(this);
  }

  setAuthState = (state: SigninResponseType) => {
    this.state = state;
    this.status = RequestStatus.success;
  };

  setRequestStatus = (status: RequestStatus) => {
    this.status = status;
  };

  resetAuthState = () => {
    this.state = {
      id: "",
      username: "",
      email: "",
      profileId: "",
      fullName: "",
      accessToken: "",
      emailVerification: false,
      hasWbApiKey: false,
      chatId: "",
    };
  };
}
