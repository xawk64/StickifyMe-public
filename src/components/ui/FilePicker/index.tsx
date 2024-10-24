import { useRef, useState } from "react";
import styles from "./styles.module.scss";
import Button from "../Button";

interface IFilePickerProps {
  label?: string;
  accept?: string;
  onChange?: (file: File | null) => void;
  showSelectedFile?: boolean;
}

const FilePicker: React.FC<IFilePickerProps> = ({
  label = "Импорт из файла .xlsx",
  accept = ".xlsx",
  onChange,
  showSelectedFile = false,
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFileName(file ? file.name : "");
    if (onChange && file) {
      onChange(file);
    } else if (onChange && !file) {
      onChange(null);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputContainer}>
        <input
          type="file"
          className={styles.hiddenInput}
          onChange={handleFileChange}
          ref={fileInputRef}
          accept={accept}
        />
        <Button label={label} onClick={handleButtonClick} />

        {showSelectedFile && selectedFileName && (
          <span className={styles.selectedFile}>{selectedFileName}</span>
        )}
      </div>
    </div>
  );
};

export default FilePicker;
