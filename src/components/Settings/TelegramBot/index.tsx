import { useStore } from "../../../store";
import Button from "../../ui/Button";

export const TelegramBot: React.FC = () => {
  const {
    authStore: {
      state: { id: userId },
    },
  } = useStore();

  return (
    <div className="flex flex-col items-center justify-center">
      <Button
        href={`https://telegram.me/StickifyMe_Bot?start=${userId}`}
        label="Подключить Telegram бота"
        target="_blank"
      ></Button>
    </div>
  );
};
