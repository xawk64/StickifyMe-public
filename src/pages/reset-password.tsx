import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import React, { useState } from "react";
import authAPI from "../api/authAPI";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Layout from "../components/Layout/Layout";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import { IServerMessageResponse } from "../api/models/ServerMessageResponseType";

const ResetPassword: React.FC = observer(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (password.length < 8) {
      newErrors.password = "Пароль должен содержать не менее 8 символов";
    } else if (
      !/^(?=.*[A-Za-z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).*$/.test(
        password
      )
    ) {
      newErrors.password =
        "Пароль должен содержать хотя бы одну букву и один специальный символ";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      newErrors.confirmPassword = "Пароли не совпадают";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    try {
      const response = await authAPI.confirmResetPassword({
        token: String(token),
        password,
      });
      toast.success(response.message);

      setTimeout(() => router.push("/auth"), 2000);
    } catch (error) {
      toast.error(
        "Произошла ошибка при сбросе пароля: " +
          (error as IServerMessageResponse).message
      );
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4 w-[300px] mx-auto items-center justify-center">
        <h2>Сброс пароля</h2>
        <Input
          type="password"
          label="Новый пароль"
          value={password}
          onChange={(value) => setPassword(value)}
          errorMessage={errors.password}
        />
        <Input
          type="password"
          label="Подтвердите пароль"
          value={confirmPassword}
          onChange={(value) => setConfirmPassword(value)}
          errorMessage={errors.confirmPassword}
        />
        <Button onClick={handleResetPassword} label="Сбросить пароль" />
      </div>
    </Layout>
  );
});

export default ResetPassword;
