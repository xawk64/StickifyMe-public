import React, { useState, useEffect } from "react";
import { useStore } from "../../../store";
import AvatarPicker from "../../ui/AvatarPicker";
import Input from "../../ui/Input/";
import Button from "../../ui/Button/";
import profileAPI from "../../../api/profileAPI";
import { toast } from "react-toastify";
import wbAPI from "../../../api/wbAPI";
import { observer } from "mobx-react-lite";

const UserSettings: React.FC = observer(() => {
  const { authStore } = useStore();
  const [fullName, setFullName] = useState(authStore.state.fullName);
  const [wbApiKey, setWbApiKey] = useState(authStore.state.wbApiKey || "");

  useEffect(() => {
    setFullName(authStore.state.fullName);
    setWbApiKey(authStore.state.wbApiKey || "");
  }, [authStore.state.fullName, authStore.state.wbApiKey]);

  const handleAvatarChange = (newAvatarUrl: string) => {
    authStore.setAuthState({ ...authStore.state, avatarUrl: newAvatarUrl });
  };

  const handleSaveSettings = async () => {
    if (!fullName || !wbApiKey) {
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
      await profileAPI.updateProfile({ fullName, wbApiKey });
      authStore.setAuthState({ ...authStore.state, fullName, wbApiKey });
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
        label="Имя компании"
        value={fullName}
        onChange={(value) => setFullName(value)}
        className="max-w-[400px]"
        isInvalid={!fullName}
        errorMessage="Поле обязательно для заполнения"
      />
      <Input
        label="Ключ Wildberries API"
        value={wbApiKey}
        onChange={(value) => setWbApiKey(value)}
        className="max-w-[400px]"
        isInvalid={!wbApiKey}
        errorMessage="Поле обязательно для заполнения"
      />
      <Button
        onClick={handleSaveSettings}
        label="Сохранить настройки"
        disabled={
          !wbApiKey ||
          !fullName ||
          (fullName === authStore.state.fullName &&
            wbApiKey === authStore.state.wbApiKey)
        }
      />
    </div>
  );
});

export default UserSettings;
