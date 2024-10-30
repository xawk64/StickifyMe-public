import React, { useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import authAPI from "../../api/authAPI";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { IServerMessageResponse } from "../../api/models/ServerMessageResponseType";

const ResetPasswordForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const [mailError, setMailError] = useState("");

  const validateForm = () => {
    if (!email) {
      setMailError("Email обязателен");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setMailError("Некорректный email");
      return false;
    }
    setMailError("");
    return true;
  };

  const handleResetPassword = async () => {
    const formIsValid = validateForm();
    if (!formIsValid) return;
    try {
      const response = await authAPI.resetPassword({ email });
      toast.success(response.message);
      router.push("/auth");
    } catch (error) {
      toast.error(
        "Произошла ошибка при отправке запроса на сброс пароля: " +
          (error as IServerMessageResponse).message
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2>Сброс пароля</h2>
      <Input
        label="Email"
        value={email}
        onChange={(value) => setEmail(value)}
        errorMessage={mailError}
      />
      <Button
        onClick={handleResetPassword}
        label="Сбросить пароль"
        disabled={!email}
      />
    </div>
  );
};

export default ResetPasswordForm;
