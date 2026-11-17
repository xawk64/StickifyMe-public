// Detects the real image type by its magic bytes; the client-provided
// file name and Content-Type are not trusted.
const SIGNATURES = [
  {
    ext: "png",
    matches: (b) =>
      b
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  { ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "webp",
    matches: (b) =>
      b.subarray(0, 4).toString("latin1") === "RIFF" &&
      b.subarray(8, 12).toString("latin1") === "WEBP",
  },
];

function detectImageExtension(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }
  const match = SIGNATURES.find((signature) => signature.matches(buffer));
  return match ? match.ext : null;
}

module.exports = { detectImageExtension };
