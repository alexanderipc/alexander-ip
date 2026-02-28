/**
 * Stateless HMAC-SHA256 unsubscribe token generation & verification.
 * No DB table needed — tokens are self-verifying.
 */
import crypto from "crypto";

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type UnsubscribeType =
  | "status_updates"
  | "document_uploads"
  | "new_messages"
  | "all";

export function generateUnsubscribeToken(
  userId: string,
  type: UnsubscribeType
): string {
  const payload = `${userId}:${type}`;
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyUnsubscribeToken(
  token: string
): { userId: string; type: UnsubscribeType } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;
    const [userId, type, signature] = parts;
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(`${userId}:${type}`)
      .digest("hex");
    if (signature !== expected) return null;
    const validTypes: UnsubscribeType[] = [
      "status_updates",
      "document_uploads",
      "new_messages",
      "all",
    ];
    if (!validTypes.includes(type as UnsubscribeType)) return null;
    return { userId, type: type as UnsubscribeType };
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(
  userId: string,
  type: UnsubscribeType
): string {
  const token = generateUnsubscribeToken(userId, type);
  return `https://www.alexander-ip.com/unsubscribe?token=${token}`;
}
