// Minimal PNG encoder (grayscale, 8 bit) to draw fake WB stickers without dependencies.
import { deflateSync } from "node:zlib";

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** Encodes a grayscale image given as rows of 0..255 values. */
export function encodeGrayPng(pixels: number[][]): Buffer {
  const height = pixels.length;
  const width = pixels[0]?.length ?? 0;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 0; // grayscale
  const raw = Buffer.concat(pixels.map((row) => Buffer.from([0, ...row]))); // filter: none
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** 580x400 "sticker": frame and barcode-like stripes derived from the order id. */
export function stickerPng(orderId: number): Buffer {
  const width = 580;
  const height = 400;
  const bits = orderId.toString(2).padStart(24, "0").repeat(4);
  const rows: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const frame = x < 6 || y < 6 || x >= width - 6 || y >= height - 6;
      const inBarcode = y > 80 && y < 260 && x > 40 && x < width - 40;
      const stripe = bits[Math.floor((x - 40) / 5) % bits.length] === "1";
      row.push(frame || (inBarcode && stripe) ? 0 : 255);
    }
    rows.push(row);
  }
  return encodeGrayPng(rows);
}
