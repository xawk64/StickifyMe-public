import crypto from "node:crypto";

const VERSION = "v1";
const IV_BYTES = 12; // recommended nonce size for GCM

/**
 * Authenticated symmetric encryption (AES-256-GCM) for secrets stored in the
 * database, e.g. sellers' WB API keys. Format: v1.<iv>.<authTag>.<ciphertext>
 * (base64url). The version prefix allows key/algorithm rotation later.
 */
export class SecretBox {
  constructor(private readonly key: Buffer) {
    if (key.length !== 32) {
      throw new Error("SecretBox key must be 32 bytes");
    }
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return [VERSION, iv, cipher.getAuthTag(), ciphertext]
      .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
      .join(".");
  }

  /** Throws if the value was tampered with or encrypted with another key. */
  decrypt(token: string): string {
    const [version, iv, tag, ciphertext] = token.split(".");
    if (version !== VERSION || !iv || !tag || ciphertext === undefined) {
      throw new Error("Unsupported secret format");
    }
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      this.key,
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  }
}
