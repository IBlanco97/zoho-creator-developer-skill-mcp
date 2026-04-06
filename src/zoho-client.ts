import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { getAccessToken } from "./auth.js";
import { API_DOMAIN } from "./config.js";

export const BASE_URL = `https://${API_DOMAIN}/creator/v2.1`;

/**
 * Creates an axios instance pre-configured for Zoho Creator API v2.1.
 * Automatically injects a fresh Bearer token before each request.
 */
function createZohoClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30_000,
  });

  // Request interceptor: attach fresh access token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getAccessToken();
      config.headers["Authorization"] = `Zoho-oauthtoken ${token}`;
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response interceptor: surface Zoho API-level errors clearly
  client.interceptors.response.use(
    (response) => {
      const data = response.data as { code?: number; message?: string };
      // Zoho returns HTTP 200 even for errors, signaled by a non-zero `code`
      if (data && typeof data.code === "number" && data.code !== 3000) {
        throw new Error(
          `Zoho API error ${data.code}: ${data.message ?? JSON.stringify(data)}`
        );
      }
      return response;
    },
    async (error: AxiosError) => {
      if (error.response) {
        const status = error.response.status;
        const body = JSON.stringify(error.response.data);

        if (status === 429) {
          // Retry up to 3 times with linear backoff: 1s → 2s → 3s
          const cfg = error.config as InternalAxiosRequestConfig & { __retries?: number };
          const retries = cfg.__retries ?? 0;
          if (retries < 3) {
            cfg.__retries = retries + 1;
            await new Promise((r) => setTimeout(r, 1_000 * (retries + 1)));
            return client.request(cfg);
          }
          throw new Error(
            "Zoho API rate limit reached (429). Retried 3 times — wait and try again."
          );
        }

        if (status === 401) {
          throw new Error(
            "Zoho API authentication failed (401). Check your OAuth credentials."
          );
        }
        throw new Error(`Zoho HTTP ${status}: ${body}`);
      }
      throw error;
    }
  );

  return client;
}

export const zohoClient = createZohoClient();
