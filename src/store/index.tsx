import { makeAutoObservable } from "mobx";
import { createContext, useContext, FC, ReactNode } from "react";
import { AuthStore } from "./authStore";

class Store {
  authStore: AuthStore;

  constructor() {
    this.authStore = new AuthStore(this);
  }
}

const StoreContext = createContext<Store>(new Store());

const StoreProvider: FC<{ store: Store; children: ReactNode }> = ({
  store,
  children,
}) => {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

const useStore = () => {
  return useContext(StoreContext);
};

export { Store, StoreProvider, useStore };
