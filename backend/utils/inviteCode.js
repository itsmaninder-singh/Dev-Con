import crypto from "crypto"

export const generateInviteCode = ()=>crypto.randomBytes(12).toString("hex")