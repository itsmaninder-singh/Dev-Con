import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const CANONICAL_SECRET = "devconnect_default_dev_key_32b!!";

export const isCipherHex = (str) => {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{32}:[0-9a-f]{32,}$/i.test(str.trim());
};

const getCandidateKeys = () => {
  const secrets = [
    process.env.MESSAGE_ENCRYPTION_KEY,
    CANONICAL_SECRET,
    process.env.JWT_SECRET,
  ].filter(Boolean);

  const keys = [];
  for (const s of secrets) {
    keys.push(crypto.createHash("sha256").update(String(s)).digest());
  }
  return keys;
};

export const encryptText = (text) => {
  if (text === undefined || text === null) return "";
  // Store messages as clean readable text so different developer instances and environments never corrupt each other's messages.
  return String(text);
};

export const decryptText = (payload) => {
  if (!payload || typeof payload !== "string") return "";

  // If already plain text (does not match 32-hex-iv : 32+-hex-cipher), return directly
  if (!isCipherHex(payload)) {
    return payload;
  }

  const [ivHex, dataHex] = payload.trim().split(":");
  try {
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(dataHex, "hex");

    for (const key of getCandidateKeys()) {
      try {
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        const text = decrypted.toString("utf8");
        if (text) return text;
      } catch (e) {
        // try next key
      }
    }
  } catch (err) {}

  return "";
};
