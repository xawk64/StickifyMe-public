import { makeAutoObservable } from "mobx";
import { Store } from ".";
import { SigninResponseType } from "../api/models/SigninResponseType";
import { RequestStatus } from "./enums";

export interface ImportStoreState {
  percentage: number;
}

export class ImportStore {
  Store;
  state: ImportStoreState = {
    percentage: 0,
  };
  status: RequestStatus = RequestStatus.pending;

  value = true;

  constructor(store: Store) {
    this.Store = store;
    makeAutoObservable(this);
  }

  setAuthState = (state: ImportStoreState) => {
    this.state = state;
    this.status = RequestStatus.success;
  };

  setImportStatus = (status: RequestStatus) => {
    this.status = status;
  };
}
