import React, { useState } from "react";
import Modal from "../../../ui/Modal";
import styles from "./ApiKeyHelp.module.scss";
import NextImage from "next/image";
import Button from "../../../ui/Button";
import wbInstructions from "../../../../assets/wb_instructions.jpg";

const ApiKeyHelp = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <span className={styles.helpLink} onClick={handleOpen}>
        Где взять ключ?
      </span>

      <Modal
        isOpen={open}
        onClose={handleClose}
        title="Как подключится к Wildberries"
        footer={<Button label="Понятно" onClick={handleClose} />}
        className={styles.modal}
      >
        <div className={styles.content}>
          <div className={styles.instructions}>
            <p>1. Откройте личный кабинет поставщика на Wildberries.</p>
            <p>
              2. Перейдите в раздел «Настройки» →{" "}
              <a
                className={styles.link}
                href="https://suppliers-portal.wildberries.ru/supplier-settings/access-to-api"
                target="_blank"
                rel="noreferrer"
              >
                «Доступ к новому API»
              </a>
              .
            </p>
            <p>
              3. Дайте токену имя — можно написать любое имя, например
              StickiFyMe.
            </p>
            <p>4. Поставьте галочку напротив «Только на чтение».</p>
            <p>5. Выберите 3 доступа: «Контент», «Маркетплейс» и «Поставки».</p>
            <p>
              6. Нажмите «Создать токен» и скопируйте его в поле Ключ
              Wildberries API
            </p>
          </div>
          <NextImage
            src={wbInstructions}
            alt="WB API Instructions"
            className={styles.image}
          />
        </div>
      </Modal>
    </>
  );
};

export default ApiKeyHelp;
