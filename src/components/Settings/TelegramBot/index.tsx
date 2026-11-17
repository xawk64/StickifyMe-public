import { useStore } from "../../../store";
import Button from "../../ui/Button";
import { TELEGRAM_BOT_NAME } from "../../../config/env";

export const TelegramBot: React.FC = () => {
  const {
    authStore: {
      state: { id: userId },
    },
  } = useStore();

  return (
    <div className="flex flex-col items-center justify-center">
      <Button
        href={`https://t.me/${TELEGRAM_BOT_NAME}?start=${userId}`}
        label="Подключить Telegram бота"
        target="_blank"
      ></Button>
    </div>
  );
};
