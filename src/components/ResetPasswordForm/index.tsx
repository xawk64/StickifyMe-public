import React, { useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import authAPI from "../../api/authAPI";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

const ResetPasswordForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleResetPassword = async () => {
    try {
      const response = await authAPI.resetPassword({ email });
      toast.success(response.message);
      router.push("/auth");
    } catch (error) {
      toast.error("Произошла ошибка при отправке запроса на сброс пароля.");
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2>Сброс пароля</h2>
      <Input
        label="Email"
        value={email}
        onChange={(value) => setEmail(value)}
      />
      <Button onClick={handleResetPassword} label="Сбросить пароль" />
    </div>
  );
};

export default ResetPasswordForm;
