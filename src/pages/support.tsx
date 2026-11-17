import React, { useState } from "react";
import Layout from "../components/Layout/Layout";
import TextArea from "../components/ui/TextArea";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { toast } from "react-toastify";
import supportAPI from "../api/supportAPI";
import { SUPPORT_EMAIL, TELEGRAM_CHANNEL_URL } from "../config/env";

const feedbackTypes = [
  { key: "problem", label: "Проблема" },
  { key: "feature", label: "Доработка" },
  { key: "review", label: "Отзыв" },
];

const Support: React.FC = () => {
  const [message, setMessage] = useState("");
  const [type, setType] = useState(feedbackTypes[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Пожалуйста, введите сообщение");
      return;
    }

    setIsLoading(true);
    try {
      const response = await supportAPI.sendFeedback({
        message,
        type: type.key,
      });
      toast.success(response.message);
      setMessage("");
      setType(feedbackTypes[0]);
    } catch {
      toast.error("Произошла ошибка при отправке сообщения");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center max-w-2xl mx-auto gap-6">
        <h1 className="text-2xl font-bold">Обратная связь</h1>

        <div className="w-full">
          <Select
            label="Тип обращения"
            initValue={type.key}
            onChange={(value) =>
              setType(
                feedbackTypes.find((item) => item.key === value[0]) ||
                  feedbackTypes[0]
              )
            }
            items={feedbackTypes}
            placeholder="Выберите тип обращения"
          />
        </div>

        <div className="w-full">
          <TextArea
            label="Сообщение"
            value={message}
            onChange={setMessage}
            placeholder="Введите ваше сообщение"
            rows={6}
          />
        </div>

        <Button
          onClick={handleSubmit}
          label="Отправить"
          disabled={isLoading || !message.trim()}
        />

        <div className="text-center mt-6">
          <p>Также вы можете связаться с нами:</p>
          <div className="flex flex-col gap-2 mt-2">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-500">
              По электронной почте
            </a>
            <a
              href={TELEGRAM_CHANNEL_URL}
              className="text-blue-500"
              target="_blank"
              rel="noreferrer"
            >
              В Telegram
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Support;
