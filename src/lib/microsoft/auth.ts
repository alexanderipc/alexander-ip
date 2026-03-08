/**
 * Microsoft OAuth token management for OneDrive integration.
 * Tokens are stored in the `oauth_tokens` Supabase table and
 * automatically refreshed when expired.
 */

import { createAdminClient } from "@/lib/supabase/admin";

const MICROSOFT_TOKEN_URL =
  "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";

interface TokenRow {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * Get a valid access token for OneDrive. Refreshes automatically if expired.
 * Returns null if no tokens are stored (needs initial authorization).
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("provider", "microsoft")
    .single();

  if (error || !data) {
    console.warn("[OneDrive] No Microsoft tokens found — run /api/auth/microsoft to authorize");
    return null;
  }

  const token = data as TokenRow;

  // Check if token is still valid (with 5-minute buffer)
  const expiresAt = new Date(token.expires_at).getTime();
  const now = Date.now();

  if (now < expiresAt - 5 * 60 * 1000) {
    return token.access_token;
  }

  // Token expired — refresh it
  return refreshAccessToken(token.refresh_token);
}

/**
 * Exchange an authorization code for access + refresh tokens.
 * Called once during the initial OAuth flow.
 */
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    code,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
    grant_type: "authorization_code",
    scope: "Files.ReadWrite offline_access",
  });

  const res = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Microsoft token exchange failed: ${res.status} ${body}`);
  }

  const json = await res.json();
  await storeTokens(json.access_token, json.refresh_token, json.expires_in);
}

/**
 * Refresh an expired access token using the refresh token.
 */
async function refreshAccessToken(
  refreshToken: string
): Promise<string | null> {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: "Files.ReadWrite offline_access",
  });

  const res = await fetch(MICROSOFT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    console.error(
      "[OneDrive] Token refresh failed:",
      res.status,
      await res.text()
    );
    return null;
  }

  const json = await res.json();
  await storeTokens(json.access_token, json.refresh_token, json.expires_in);
  return json.access_token;
}

/**
 * Store tokens in Supabase (upsert by provider).
 */
async function storeTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const supabase = createAdminClient();
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const { error } = await supabase
    .from("oauth_tokens")
    .upsert(
      {
        provider: "microsoft",
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider" }
    );

  if (error) {
    console.error("[OneDrive] Failed to store tokens:", error.message);
  }
}
