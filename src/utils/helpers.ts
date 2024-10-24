export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} минут`;
  } else {
    return `${minutes} минут ${remainingSeconds} секунд`;
  }
}
