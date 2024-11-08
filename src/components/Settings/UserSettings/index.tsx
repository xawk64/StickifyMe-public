import React, { useState, useEffect } from "react";
import { useStore } from "../../../store";
import AvatarPicker from "../../ui/AvatarPicker";
import Input from "../../ui/Input/";
import Button from "../../ui/Button/";
import profileAPI from "../../../api/profileAPI";
import { toast } from "react-toastify";
import wbAPI from "../../../api/wbAPI";
import { observer } from "mobx-react-lite";
import ApiKeyHelp from "./ApiKeyHelp";
import authAPI from "../../../api/authAPI";
import { RequestStatus } from "../../../store/enums";

const UserSettings: React.FC = observer(() => {
  const { authStore } = useStore();
  const [companyName, setCompanyName] = useState(
    authStore.state.fullName || ""
  );
  const [wbApiKey, setWbApiKey] = useState(authStore.state.wbApiKey || "");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    setCompanyName(authStore.state.fullName);
    setWbApiKey(authStore.state.wbApiKey || "");
  }, [authStore.state.fullName, authStore.state.wbApiKey]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleAvatarChange = (newAvatarUrl: string) => {
    authStore.setAuthState({ ...authStore.state, avatarUrl: newAvatarUrl });
  };

  const handleResendVerification = async () => {
    if (resendTimer > 0) return;

    try {
      await authAPI.resendVerification();
      toast.success("Письмо с подтверждением отправлено на вашу почту");
      setResendTimer(60);
    } catch (error) {
      toast.error("Ошибка при отправке письма подтверждения");
    }
  };

  const handleSaveSettings = async () => {
    if (!companyName || !wbApiKey) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }
    try {
      if (wbApiKey !== authStore.state.wbApiKey) {
        const isApiKeyValid = await wbAPI.checkApiKey(wbApiKey);
        if (!isApiKeyValid) {
          toast.error("Ключ API неверный");
          return;
        }
      }
      await profileAPI.updateProfile({ fullName: companyName, wbApiKey });
      authStore.setAuthState({
        ...authStore.state,
        fullName: companyName,
        wbApiKey,
      });
      toast.success("Настройки успешно сохранены");
    } catch (error) {
      toast.error("Ошибка при сохранении настроек");
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <AvatarPicker
        currentAvatar={
          authStore.state.avatarUrl
            ? (process.env.NEXT_PUBLIC_API_URL || "") +
              authStore.state.avatarUrl
            : process.env.NEXT_PUBLIC_API_URL +
              "/uploads/avatars/default_avatar.jpg"
        }
        onAvatarChange={handleAvatarChange}
      />
      <Input
        label="Email"
        value={authStore.state.email}
        className="max-w-[400px]"
        disabled={true}
      />
      <Input
        label="Название компании"
        value={companyName}
        onChange={(value) => setCompanyName(value)}
        className="max-w-[400px]"
        isInvalid={authStore.status === RequestStatus.success && !companyName}
        errorMessage="Поле обязательно для заполнения"
      />
      <Input
        label="Ключ Wildberries API"
        value={wbApiKey}
        onChange={(value) => setWbApiKey(value)}
        className="max-w-[400px]"
        isInvalid={authStore.status === RequestStatus.success && !wbApiKey}
        errorMessage="Для работы сервиса необходим ключ API"
      />
      <ApiKeyHelp />
      {authStore.status === RequestStatus.success &&
        !authStore.state.emailVerification && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 w-full max-w-[400px]">
            <p>
              Ваша почта не подтверждена. Пожалуйста, проверьте почту и папку
              спам для подтверждения email. Это необходимо для получения полного
              доступа к сервису.
            </p>
            <div className="mt-2">
              <Button
                onClick={handleResendVerification}
                label={
                  resendTimer > 0
                    ? `Повторная отправка через ${resendTimer}с`
                    : "Отправить письмо повторно"
                }
                disabled={resendTimer > 0}
                type="secondary"
                size="sm"
              />
            </div>
          </div>
        )}
      <Button
        onClick={handleSaveSettings}
        label="Сохранить настройки"
        disabled={
          !wbApiKey ||
          !companyName ||
          (companyName === authStore.state.fullName &&
            wbApiKey === authStore.state.wbApiKey)
        }
      />
    </div>
  );
});

export default UserSettings;
