// Detects the real image type by its magic bytes; the client-provided
// file name and Content-Type are not trusted.
export type ImageExtension = "png" | "jpg" | "webp";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const SIGNATURES: { ext: ImageExtension; matches: (b: Buffer) => boolean }[] = [
  { ext: "png", matches: (b) => b.subarray(0, 8).equals(PNG_SIGNATURE) },
  { ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "webp",
    matches: (b) =>
      b.subarray(0, 4).toString("latin1") === "RIFF" &&
      b.subarray(8, 12).toString("latin1") === "WEBP",
  },
];

export function detectImageExtension(buffer: unknown): ImageExtension | null {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }
  return SIGNATURES.find((signature) => signature.matches(buffer))?.ext ?? null;
}
