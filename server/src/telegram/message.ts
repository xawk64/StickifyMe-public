/** Telegram rejects messages longer than 4096 characters. */
export const TELEGRAM_MESSAGE_LIMIT = 4096;

/**
 * Packs text blocks into as few messages as possible without splitting a block;
 * a single block longer than the limit is cut into pieces.
 */
export function splitMessage(
  blocks: readonly string[],
  limit = TELEGRAM_MESSAGE_LIMIT,
): string[] {
  const messages: string[] = [];
  let current = "";
  for (const block of blocks) {
    if (current && current.length + block.length > limit) {
      messages.push(current);
      current = "";
    }
    if (block.length > limit) {
      for (let i = 0; i < block.length; i += limit) {
        messages.push(block.slice(i, i + limit));
      }
      continue;
    }
    current += block;
  }
  if (current) {
    messages.push(current);
  }
  return messages;
}
