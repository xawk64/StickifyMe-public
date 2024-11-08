import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import authAPI from "../api/authAPI";
import { useStore } from "../store";
import { toast } from "react-toastify";
import { IServerMessageResponse } from "../api/models/ServerMessageResponseType";
import Layout from "../components/Layout/Layout";

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
        try {
          const { emailVerification } = await authAPI.loadVerifyEmail({
            hash: String(hash),
          });
          setEmailVerification(emailVerification);

          setAuthState({ ...state, emailVerification });
          toast.success(
            `Вы успешно подтвердили email. ${
              !state.wbApiKey
                ? "Не забудьте добавить ключ WB для полного доступа к сервису!"
                : "Теперь вы можете использовать все возможности сервиса!"
            }`
          );
        } catch (error) {
          toast.error((error as IServerMessageResponse).message);
        }
      })();
    }
  }, [hash]);

  useEffect(() => {
    if (emailVerification) {
      router.push("/settings");
    }
  }, [emailVerification]);

  return (
    <Layout>
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-bold">
          Подтверждение email прошло успешно!
        </div>
      </div>
    </Layout>
  );
});

export default VerifyEmail;
