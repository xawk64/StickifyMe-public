import { useCallback, useEffect, useState } from "react";
import telegramAPI from "../../../api/telegramAPI";
import Button from "../../ui/Button";
import { TELEGRAM_BOT_NAME } from "../../../config/env";

/**
 * The deep link carries a one-time token issued by the API (valid for 15 minutes),
 * not the user id: knowing someone's id is not enough to link a chat to their account.
 */
export const TelegramBot: React.FC = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const refreshToken = useCallback(async () => {
    try {
      const { token } = await telegramAPI.createLinkToken();
      setLinkToken(token);
    } catch {
      setLinkToken(null);
    }
  }, []);

  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  return (
    <div className="flex flex-col items-center justify-center">
      <Button
        href={
          linkToken
            ? `https://t.me/${TELEGRAM_BOT_NAME}?start=${linkToken}`
            : undefined
        }
        label="Подключить Telegram бота"
        target="_blank"
        disabled={!linkToken}
        // a token is single-use: prepare a fresh one once the link is opened
        onClick={() => setTimeout(refreshToken, 1000)}
      ></Button>
    </div>
  );
};
