// Shared in-memory store for demo purposes (not persistent across cold starts)
export const users = new Map(); // publicKey -> { publicKey, nonce, registeredAt }
export const sessions = new Map(); // publicKey -> { token, expires }
