import crypto from "crypto"

export const generateInviteCode = ()=>crypto.randomBytes(6).toString("hex")