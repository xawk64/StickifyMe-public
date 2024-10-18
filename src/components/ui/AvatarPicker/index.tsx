import React, { useState } from "react";
import {
  Button,
  Modal,
  Image,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";
import FilePicker from "../../ui/FilePicker";
import fileAPI from "../../../api/fileAPI";

interface AvatarPickerProps {
  currentAvatar: string;
  onAvatarChange: (newAvatarUrl: string) => void;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentAvatar,
  onAvatarChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      try {
        const response = await fileAPI.uploadAvatar(selectedFile);
        // Обновите текущий аватар или выполните другие действия с полученным URL
        onAvatarChange(response.url);
        setIsOpen(false);
      } catch (error) {
        console.error("Ошибка при загрузке аватара:", error);
        // Добавьте обработку ошибок, например, показ уведомления пользователю
      }
    }
  };

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Изменить аватар</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader>Выберите новый аватар</ModalHeader>
        <ModalBody>
          <Image
            src={currentAvatar}
            alt="Текущий аватар"
            width={100}
            height={100}
          />
          <FilePicker onChange={handleFileChange} />
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onPress={handleUpload}
            disabled={!selectedFile}
          >
            Загрузить
          </Button>
          <Button color="secondary" onPress={() => setIsOpen(false)}>
            Отмена
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AvatarPicker;
