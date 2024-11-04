function getTimeDeclension(
  number: number,
  words: [string, string, string]
): string {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    number % 100 > 4 && number % 100 < 20 ? 2 : cases[Math.min(number % 10, 5)]
  ];
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const minuteWord = getTimeDeclension(minutes, ["минута", "минуты", "минут"]);
  const secondWord = getTimeDeclension(remainingSeconds, [
    "секунда",
    "секунды",
    "секунд",
  ]);

  const minutesText = minutes === 0 ? "" : `${minutes} ${minuteWord}`;
  const secondsText =
    remainingSeconds === 0 ? "" : `${remainingSeconds} ${secondWord}`;

  return `${minutesText} ${secondsText}`;
}
