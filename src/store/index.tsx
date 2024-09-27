import { createContext, useContext, FC, ReactNode } from "react";
import { AuthStore } from "./authStore";
import { ImportStore } from "./importStore";

class Store {
  authStore: AuthStore;
  importStore: ImportStore;

  constructor() {
    this.authStore = new AuthStore(this);
    this.importStore = new ImportStore(this);
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
