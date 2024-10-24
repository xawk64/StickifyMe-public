import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import authAPI from "../api/authAPI";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import RadioGroup from "../components/ui/RadioGroup";
import { useStore } from "../store";
import Link from "next/link";

enum AuthType {
  signIn = "signIn",
  signUp = "signUp",
}

const radioItems = [
  { label: "Вход", value: AuthType.signIn as string },
  { label: "Регистрация", value: AuthType.signUp as string },
];

const Auth: React.FC = observer(() => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const router = useRouter();

  const { type } = router.query;

  const {
    authStore: { state, setAuthState },
  } = useStore();

  useEffect(() => {
    if (state.accessToken) {
      if (state.wbApiKey) {
        router.push("/imports");
      } else {
        router.push("/settings");
      }
    }
  }, [state]);

  const [authType, setAuthType] = useState(
    radioItems.find((item) => item.value === type) || radioItems[0]
  );

  const onLoginLogoutClick = useCallback(async () => {
    if (authType.value === AuthType.signUp) {
      await authAPI.loadSignup({ email, username, password });
      setAuthState(await authAPI.loadSignIn({ username, password }));
    } else {
      setAuthState(await authAPI.loadSignIn({ username, password }));
    }
  }, [authType.value, email, username, password]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-80 flex flex-col items-center">
        <div className="mb-4">
          <RadioGroup
            items={radioItems}
            value={authType}
            onChange={setAuthType}
          />
        </div>
        <div className="flex flex-col gap-4 w-full">
          <div className="w-full">
            <Input value={username} onChange={setUsername} label="Логин" />
          </div>

          {authType.value === AuthType.signUp && (
            <div className="w-full">
              <Input value={email} onChange={setEmail} label="E-mail" />
            </div>
          )}

          <div className="w-full mb-8">
            <Input value={password} onChange={setPassword} label="Пароль" />
          </div>
        </div>

        <Button onClick={onLoginLogoutClick} label={authType.label} />

        <div className="mt-4 text-center">
          <Link href="/reset-password-form">Забыли пароль?</Link>
        </div>
      </div>
    </div>
  );
});

export default Auth;
