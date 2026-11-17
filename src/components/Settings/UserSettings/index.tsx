import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
import { useStore } from "../../../store";
import AvatarPicker from "../../ui/AvatarPicker";
import Input from "../../ui/Input/";
import Button from "../../ui/Button/";
import profileAPI from "../../../api/profileAPI";
import { getErrorMessage } from "../../../api";
import ApiKeyHelp from "./ApiKeyHelp";
import { RequestStatus } from "../../../store/enums";
import { API_URL } from "../../../config/env";

/**
 * The WB API key is write-only: the server validates it against WB, stores it
 * encrypted and only reports whether a key is present (hasWbApiKey).
 */
const UserSettings: React.FC = observer(() => {
  const { authStore } = useStore();
  const [companyName, setCompanyName] = useState(authStore.state.fullName || "");
  const [newWbApiKey, setNewWbApiKey] = useState("");
  const hasWbApiKey = authStore.state.hasWbApiKey;

  useEffect(() => {
    setCompanyName(authStore.state.fullName);
  }, [authStore.state.fullName]);

  const handleAvatarChange = (newAvatarUrl: string) => {
    authStore.setAuthState({ ...authStore.state, avatarUrl: newAvatarUrl });
  };

  const nameChanged = companyName !== authStore.state.fullName;
  const keyEntered = newWbApiKey.trim().length > 0;

  const handleSaveSettings = async () => {
    if (!companyName || (!hasWbApiKey && !keyEntered)) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }
    try {
      if (nameChanged) {
        await profileAPI.updateProfile({ fullName: companyName });
      }
      if (keyEntered) {
        await profileAPI.setWbApiKey(newWbApiKey.trim());
      }
      authStore.setAuthState({
        ...authStore.state,
        fullName: companyName,
        hasWbApiKey: hasWbApiKey || keyEntered,
      });
      setNewWbApiKey("");
      toast.success("Настройки успешно сохранены");
    } catch (error) {
      toast.error(getErrorMessage(error, "Ошибка при сохранении настроек"));
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <AvatarPicker
        currentAvatar={
          API_URL + (authStore.state.avatarUrl || "/uploads/avatars/default_avatar.jpg")
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
        label={hasWbApiKey ? "Новый ключ Wildberries API" : "Ключ Wildberries API"}
        value={newWbApiKey}
        onChange={(value) => setNewWbApiKey(value)}
        placeholder={hasWbApiKey ? "Ключ сохранён. Введите новый, чтобы заменить" : ""}
        className="max-w-[400px]"
        isInvalid={
          authStore.status === RequestStatus.success && !hasWbApiKey && !keyEntered
        }
        errorMessage="Для работы сервиса необходим ключ API"
      />
      <ApiKeyHelp />
      <Button
        onClick={handleSaveSettings}
        label="Сохранить настройки"
        disabled={
          !companyName || (!nameChanged && !keyEntered) || (!hasWbApiKey && !keyEntered)
        }
      />
    </div>
  );
});

export default UserSettings;
