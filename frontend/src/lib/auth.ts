export interface AuthSessionPayload {
  access_token: string | null;
  refresh_token: string | null;
  token_type: string | null;
  expires_in: number | null;
  expires_at: number | null;
  user: Record<string, unknown> | null;
}

interface LoginWithPasswordOptions {
  apiBaseUrl?: string;
  email: string;
  password: string;
  signal?: AbortSignal;
}

interface SignUpWithPasswordOptions {
  apiBaseUrl?: string;
  email: string;
  password: string;
  signal?: AbortSignal;
}

function resolveApiBaseUrl(apiBaseUrl?: string): string {
  const rawBaseUrl =
    apiBaseUrl?.trim() ??
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ??
    window.location.origin;
  return rawBaseUrl.replace(/\/+$/, "");
}

async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function loginWithPassword({
  apiBaseUrl,
  email,
  password,
  signal,
}: LoginWithPasswordOptions): Promise<AuthSessionPayload> {
  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
    signal,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const detail =
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof (payload as { detail?: unknown }).detail === "string"
        ? (payload as { detail: string }).detail
        : "Connexion impossible";
    throw new Error(detail);
  }

  return payload as AuthSessionPayload;
}

export async function signUpWithPassword({
  apiBaseUrl,
  email,
  password,
  signal,
}: SignUpWithPasswordOptions): Promise<AuthSessionPayload> {
  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
    signal,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const detail =
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof (payload as { detail?: unknown }).detail === "string"
        ? (payload as { detail: string }).detail
        : "Creation impossible";
    throw new Error(detail);
  }

  return payload as AuthSessionPayload;
}

export function startGoogleOAuth(apiBaseUrl?: string): void {
  window.location.assign(`${resolveApiBaseUrl(apiBaseUrl)}/auth/google/start`);
}
