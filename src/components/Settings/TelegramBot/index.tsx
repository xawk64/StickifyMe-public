import { useStore } from "../../../store";

export const TelegramBot: React.FC = () => {
  const {
    authStore: {
      state: { id: userId },
    },
  } = useStore();

  return (
    <a href={`https://t.me/StickifyMe_Bot?start=${userId}`} target="_blank">
      Telegram
    </a>
  );
};
