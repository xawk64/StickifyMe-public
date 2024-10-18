import React, { useState } from "react";
import { useStore } from "../../../store";
import AvatarPicker from "../../ui/AvatarPicker";
import { Input, Button } from "@nextui-org/react";

const UserSettings: React.FC = () => {
  const { authStore } = useStore();
  const [fullName, setFullName] = useState(authStore.state.fullName);
  const [email, setEmail] = useState(authStore.state.email);

  const handleAvatarChange = (newAvatarUrl: string) => {
    // Здесь можно добавить логику для обновления аватара в store
    console.log("New avatar URL:", newAvatarUrl);
  };

  const handleSaveSettings = () => {
    // Здесь можно добавить логику для сохранения настроек пользователя
    console.log("Saving user settings:", { fullName, email });
  };

  return (
    <div>
      <h2>Настройки пользователя</h2>
      <AvatarPicker
        currentAvatar={
          authStore.state.avatarUrl || "https://example.com/default-avatar.png"
        }
        onAvatarChange={handleAvatarChange}
      />
      <Input
        label="Полное имя"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <Input
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button onClick={handleSaveSettings}>Сохранить настройки</Button>
    </div>
  );
};

export default UserSettings;
