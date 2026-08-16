import crypto from "crypto";
const ALGORITHM = "aes-256-cbc";

const getKey = () => {
  const secret = process.env.MESSAGE_ENCRYPTION_KEY || "devconnect_default_dev_key_32b!!";
  return crypto.createHash("sha256").update(String(secret)).digest();
};

export const encryptText = (text) => {
  if (text === undefined || text === null) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptText = (payload) => {
  if (!payload || typeof payload !== "string" || !payload.includes(":")) return "";
  try {
    const [ivHex, dataHex] = payload.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(dataHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    return "";
  }
};
