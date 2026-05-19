/**
 * Stateless HMAC-SHA256 unsubscribe token generation & verification.
 * No DB table needed — tokens are self-verifying.
 */
import crypto from "crypto";

const SECRET = process.env.UNSUBSCRIBE_SECRET!;
// Legacy fallback for tokens generated before UNSUBSCRIBE_SECRET was set
const LEGACY_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TOKEN_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export type UnsubscribeType =
  | "status_updates"
  | "document_uploads"
  | "new_messages"
  | "all";

function hmacSign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function generateUnsubscribeToken(
  userId: string,
  type: UnsubscribeType
): string {
  const timestamp = Date.now().toString(36);
  const payload = `${userId}:${type}:${timestamp}`;
  const signature = hmacSign(payload, SECRET);
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyUnsubscribeToken(
  token: string
): { userId: string; type: UnsubscribeType } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");

    const validTypes: UnsubscribeType[] = [
      "status_updates",
      "document_uploads",
      "new_messages",
      "all",
    ];

    // New format: userId:type:timestamp:signature (4 parts)
    if (parts.length === 4) {
      const [userId, type, timestamp, signature] = parts;
      const payload = `${userId}:${type}:${timestamp}`;
      const expected = hmacSign(payload, SECRET);
      if (!timingSafeCompare(signature, expected)) return null;
      if (!validTypes.includes(type as UnsubscribeType)) return null;
      // Check expiry
      const issuedAt = parseInt(timestamp, 36);
      if (isNaN(issuedAt) || Date.now() - issuedAt > TOKEN_MAX_AGE_MS) return null;
      return { userId, type: type as UnsubscribeType };
    }

    // Legacy format: userId:type:signature (3 parts) — accept with legacy secret
    if (parts.length === 3 && LEGACY_SECRET) {
      const [userId, type, signature] = parts;
      const expected = hmacSign(`${userId}:${type}`, LEGACY_SECRET);
      if (!timingSafeCompare(signature, expected)) return null;
      if (!validTypes.includes(type as UnsubscribeType)) return null;
      return { userId, type: type as UnsubscribeType };
    }

    return null;
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
