import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import authAPI from "../api/authAPI";
import Button from "../components/ui/Button/Button";
import Input from "../components/ui/Input/Input";
import RadioGroup from "../components/ui/RadioGroup/RadioGroup";
import { useStore } from "../store";

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

  const {
    authStore: { state, setAuthState },
  } = useStore();

  useEffect(() => {
    if (state.accessToken) {
      router.push("/");
    }
  }, [state]);

  const [authType, setAuthType] = useState(radioItems[1]);

  const onLoginLogoutClick = useCallback(async () => {
    if (authType.value === AuthType.signUp) {
      await authAPI.loadSignup({ email, username, password });
      setAuthState(await authAPI.loadSignIn({ username, password }));
    } else {
      setAuthState(await authAPI.loadSignIn({ username, password }));
    }
  }, [authType.value, email, username, password]);

  return (
    <div
      className="my-0
    mx-auto w-80"
    >
      <h1 className="mb-2">Вход или регистрация</h1>

      <div className="mb-4">
        <RadioGroup
          items={radioItems}
          value={authType}
          onChange={setAuthType}
        />
      </div>
      <div className="max-w-xs">
        <Input value={username} onChange={setUsername} label="Логин" />
      </div>

      {authType.value === AuthType.signUp && (
        <div className="max-w-xs">
          <Input value={email} onChange={setEmail} label="E-mail" />
        </div>
      )}

      <div className="max-w-xs mb-8">
        <Input value={password} onChange={setPassword} label="Пароль" />
      </div>

      <Button onClick={onLoginLogoutClick} label={authType.label} />
    </div>
  );
});

export default Auth;
