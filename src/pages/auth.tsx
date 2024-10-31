import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import authAPI from "../api/authAPI";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useStore } from "../store";
import Link from "next/link";
import { toast } from "react-toastify";
import { IServerMessageResponse } from "../api/models/ServerMessageResponseType";
import Tabs, { ITabItem } from "../components/ui/Tabs";
import Layout from "../components/Layout/Layout";

enum AuthType {
  signIn = "/auth?type=signIn",
  signUp = "/auth?type=signUp",
}

const tabsItems: ITabItem[] = [
  { label: "Вход", href: `${AuthType.signIn as string}` },
  { label: "Регистрация", href: `${AuthType.signUp as string}` },
];

const Auth: React.FC = observer(() => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
    tabsItems.find((item) =>
      typeof type === "string" ? item.href.includes(type) : tabsItems[0]
    ) || tabsItems[0]
  );

  const handleAuthTypeChange = (value: ITabItem | undefined) => {
    router.push(value?.href || AuthType.signIn);
    setErrors({});
    if (value) setAuthType(value);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (authType.href === AuthType.signUp) {
      if (!email) {
        newErrors.email = "Email обязателен";
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Некорректный email";
      }

      if (password.length < 8) {
        newErrors.password = "Пароль должен содержать не менее 8 символов";
      } else if (
        !/^(?=.*[A-Za-z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/.test(
          password
        )
      ) {
        newErrors.password =
          "Пароль должен содержать хотя бы одну букву и один специальный символ";
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Пароли не совпадают";
      }
    }

    if (!username) {
      newErrors.username = "Имя пользователя обязательно";
    }

    if (!password) {
      newErrors.password = "Пароль обязателен";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSignInSignUpClick = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (authType.href === AuthType.signUp) {
      try {
        const signUpData: IServerMessageResponse = await authAPI.loadSignup({
          email,
          username,
          password,
        });
        const signInData = await authAPI.loadSignIn({ username, password });
        setAuthState(signInData);
        toast.success(signUpData.message);
      } catch (e) {
        toast.error(
          "Ошибка регистрации: " + (e as IServerMessageResponse).message
        );
      }
    } else {
      try {
        const signInData = await authAPI.loadSignIn({ username, password });
        setAuthState(signInData);
        toast.success("Вход выполнен успешно!");
      } catch (e) {
        toast.error(
          "Ошибка авторизации: " + (e as IServerMessageResponse).message
        );
      }
    }
  }, [authType.href, email, username, password, confirmPassword]);

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-[350px] p-6 flex flex-col items-center shadow-lg bg-stone-300 rounded-md">
        <div className="mb-4">
          <Tabs items={tabsItems} setValue={handleAuthTypeChange} />
        </div>
        <div className="flex flex-col gap-4 w-full">
          <div className="w-full">
            <Input
              value={username}
              onChange={setUsername}
              label="Логин"
              errorMessage={errors.username}
            />
          </div>

          {authType.href === AuthType.signUp && (
            <div className="w-full">
              <Input
                value={email}
                onChange={setEmail}
                label="E-mail"
                errorMessage={errors.email}
              />
            </div>
          )}

          <div className="w-full">
            <Input
              value={password}
              onChange={setPassword}
              label="Пароль"
              type="password"
              errorMessage={errors.password}
            />
          </div>

          {authType.href === AuthType.signUp && (
            <div className="w-full">
              <Input
                value={confirmPassword}
                onChange={setConfirmPassword}
                label="Подтвердите пароль"
                type="password"
                errorMessage={errors.confirmPassword}
              />
            </div>
          )}
        </div>

        <Button
          className="mt-4"
          onClick={onSignInSignUpClick}
          label={authType.label}
          disabled={
            !username ||
            !password ||
            (authType.href === AuthType.signUp ? !email : false)
          }
        />

        <div className="mt-4 text-center text-green-800">
          <Link href="/reset-password-form">Забыли пароль?</Link>
        </div>
      </div>
      </div>
    </Layout>
  );
});

export default Auth;
