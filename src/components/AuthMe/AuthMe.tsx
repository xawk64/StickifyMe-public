import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import authAPI from "../../api/authAPI";
import { useStore } from "../../store";
import { RequestStatus } from "../../store/enums";

const AuthMe: React.FC = observer(() => {
  const {
    authStore: {
      setAuthState,
      setRequestStatus,
      state: { username },
    },
  } = useStore();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && token !== "undefined" && !username) {
      (async () => {
        try {
          setRequestStatus(RequestStatus.pending);
          const userData = await authAPI.loadAuthMe();
          setAuthState({ ...userData, accessToken: token });
        } catch {
          setRequestStatus(RequestStatus.error);
        }
      })();
    }
    if (!token) {
      setRequestStatus(RequestStatus.error);
    }
  }, []);
  return null;
});

export default AuthMe;
