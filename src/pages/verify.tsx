import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import authAPI from "../api/authAPI";
import { useStore } from "../store";

const VerifyEmail: React.FC = observer(() => {
  const router = useRouter();
  const { hash } = router.query;
  const {
    authStore: { state, setAuthState },
  } = useStore();

  const [emailVerification, setEmailVerification] = useState(false);

  useEffect(() => {
    if (hash) {
      (async () => {
        const { emailVerification } = await authAPI.loadVerifyEmail({
          hash: String(hash),
        });
        setEmailVerification(emailVerification);

        setAuthState({ ...state, emailVerification });
      })();
    }
  }, [hash]);

  useEffect(() => {
    if (emailVerification) {
      router.push("/");
    }
  }, [emailVerification]);

  return null;
});

export default VerifyEmail;
