import type { Response } from "superagent";

/** supertest parser that collects a binary body into a Buffer */
export function binaryParser(
  res: Response,
  callback: (err: Error | null, body: Buffer) => void,
): void {
  // in Node the superagent response is the underlying readable stream
  const stream = res as unknown as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  stream.on("data", (chunk: Buffer) => chunks.push(chunk));
  stream.on("end", () => callback(null, Buffer.concat(chunks)));
}

export function countPdfPages(buffer: Buffer): number {
  return (buffer.toString("latin1").match(/\/Type \/Page\b/g) || []).length;
}
