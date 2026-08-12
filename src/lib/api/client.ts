import { getAccessToken, setAccessToken } from "@/lib/auth/token";
import type { ApiErrorBody, RefreshResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  statusCode: number;
  error: string;

  constructor(body: ApiErrorBody) {
    super(Array.isArray(body.message) ? body.message.join(", ") : body.message);
    this.statusCode = body.statusCode;
    this.error = body.error;
  }
}

async function parseBody(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// L'API impose un seul refresh en vol à la fois (rejouer un refresh token déjà
// utilisé invalide la session) — voir API-REFERENCE.md. On mémorise la promesse
// en cours pour que les requêtes concurrentes attendent le même refresh.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          setAccessToken(null);
          throw new ApiError(await parseBody(response));
        }
        const body = (await parseBody(response)) as RefreshResponse;
        setAccessToken(body.accessToken);
        return body.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Injecte l'access token et retente une fois après refresh sur 401. Défaut true. */
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, body, headers, ...rest } = options;

  const isFormData = body instanceof FormData;
  const finalHeaders = new Headers(headers);
  if (body !== undefined && !isFormData) finalHeaders.set("Content-Type", "application/json");
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }
  const finalBody = isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: finalHeaders,
    body: finalBody,
  });

  if (auth && response.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      finalHeaders.set("Authorization", `Bearer ${newToken}`);
      const retryResponse = await fetch(`${API_URL}${path}`, {
        ...rest,
        credentials: "include",
        headers: finalHeaders,
        body: finalBody,
      });
      if (!retryResponse.ok) throw new ApiError(await parseBody(retryResponse));
      return (await parseBody(retryResponse)) as T;
    } catch (err) {
      // Hors de l'arbre React ici (module partagé), pas de useRouter disponible.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (typeof window !== "undefined") window.location.href = "/login";
      throw err;
    }
  }

  if (!response.ok) throw new ApiError(await parseBody(response));
  return (await parseBody(response)) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
