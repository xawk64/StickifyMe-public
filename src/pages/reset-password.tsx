import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import React, { useState } from "react";
import authAPI from "../api/authAPI";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Layout from "../components/Layout/Layout";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";

const ResetPassword: React.FC = observer(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = async () => {
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
      toast.error("Произошла ошибка при сбросе пароля.");
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
        />
        <Input
          type="password"
          label="Подтвердите пароль"
          value={confirmPassword}
          onChange={(value) => setConfirmPassword(value)}
        />
        <Button onClick={handleResetPassword} label="Сбросить пароль" />
      </div>
    </Layout>
  );
});

export default ResetPassword;
