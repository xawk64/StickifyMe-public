import React, { useState } from "react";
import { Image } from "@nextui-org/react";
import FilePicker from "../../ui/FilePicker";
import fileAPI from "../../../api/fileAPI";
import Button from "../Button";
import Modal from "../Modal/";
import { toast } from "react-toastify";

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
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(currentAvatar);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      try {
        const response = await fileAPI.uploadAvatar(selectedFile);
        onAvatarChange(response.avatarUrl);
        setIsOpen(false);
        toast.success("Аватар успешно загружен");
      } catch (error) {
        toast.error("Ошибка при загрузке аватара");
      }
    }
  };

  return (
    <>
      <Image
        src={currentAvatar}
        alt="Предпросмотр аватара"
        width={100}
        height={100}
        className="object-cover"
      />
      <Button label="Изменить аватар" onClick={() => setIsOpen(true)} />
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Выберите новый аватар"
        footer={
          <div className="flex gap-4 justify-end">
            <Button
              label="Загрузить"
              onClick={handleUpload}
              disabled={!selectedFile}
            />
            <Button label="Отмена" onClick={() => setIsOpen(false)} />
          </div>
        }
      >
        <div className="flex gap-4 items-center">
          <Image
            src={previewUrl || currentAvatar}
            alt="Текущий аватар"
            width={100}
            height={100}
            className="object-cover"
          />
          <FilePicker
            onChange={handleFileChange}
            label="Выберите файл (.png, .jpg, .jpeg)"
            accept=".png,.jpg,.jpeg"
          />
        </div>
      </Modal>
    </>
  );
};

export default AvatarPicker;
