import axios from "axios";

interface TokenCache {
  accessToken: string;
  expiresAt: number; // Unix ms
}

let cache: TokenCache | null = null;

/**
 * Returns a valid Zoho access token, refreshing automatically when expired.
 * Token is cached in-memory for the duration of the process.
 */
export async function getAccessToken(): Promise<string> {
  // Read lazily (not at module load time) so dotenv.config() in index.ts
  // has already populated process.env before this runs.
  const ACCOUNTS_DOMAIN =
    process.env.ZOHO_ACCOUNTS_DOMAIN ?? "accounts.zoho.com";
  const now = Date.now();

  // Reuse cached token if it still has >60s of life
  if (cache && cache.expiresAt - now > 60_000) {
    return cache.accessToken;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Zoho OAuth credentials. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN in your environment."
    );
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await axios.post(
    `https://${ACCOUNTS_DOMAIN}/oauth/v2/token`,
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const data = response.data as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (data.error || !data.access_token) {
    throw new Error(
      `Zoho OAuth error: ${data.error ?? "no access_token in response"}`
    );
  }

  const expiresIn = (data.expires_in ?? 3600) * 1000; // convert s -> ms
  cache = {
    accessToken: data.access_token,
    expiresAt: now + expiresIn,
  };

  return cache.accessToken;
}
