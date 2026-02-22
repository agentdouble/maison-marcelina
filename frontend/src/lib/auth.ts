export interface AuthSessionPayload {
  access_token: string | null;
  refresh_token: string | null;
  token_type: string | null;
  expires_in: number | null;
  expires_at: number | null;
  user: Record<string, unknown> | null;
}

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
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

export interface AccountProfilePayload {
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AccountOrderPayload {
  id: number | null;
  order_number: string;
  status: string;
  total_amount: number | string;
  currency: string;
  items_count: number;
  ordered_at: string | null;
  created_at: string | null;
}

interface AccountRequestOptions {
  apiBaseUrl?: string;
  accessToken: string;
  signal?: AbortSignal;
}

interface UpdateAccountProfileOptions extends AccountRequestOptions {
  full_name: string | null;
  phone: string | null;
  address: string | null;
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

function extractApiError(payload: unknown, fallback: string): string {
  return typeof payload === "object" &&
    payload !== null &&
    "detail" in payload &&
    typeof (payload as { detail?: unknown }).detail === "string"
    ? (payload as { detail: string }).detail
    : fallback;
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
    throw new ApiRequestError(extractApiError(payload, "Connexion impossible"), response.status);
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
    throw new ApiRequestError(extractApiError(payload, "Création impossible"), response.status);
  }

  return payload as AuthSessionPayload;
}

export async function getAccountProfile({
  apiBaseUrl,
  accessToken,
  signal,
}: AccountRequestOptions): Promise<AccountProfilePayload> {
  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/account/profile`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiRequestError(
      extractApiError(payload, "Lecture profil impossible"),
      response.status,
    );
  }

  return payload as AccountProfilePayload;
}

export async function updateAccountProfile({
  apiBaseUrl,
  accessToken,
  full_name,
  phone,
  address,
  signal,
}: UpdateAccountProfileOptions): Promise<AccountProfilePayload> {
  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/account/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ full_name, phone, address }),
    signal,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiRequestError(
      extractApiError(payload, "Enregistrement profil impossible"),
      response.status,
    );
  }

  return payload as AccountProfilePayload;
}

export async function listAccountOrders({
  apiBaseUrl,
  accessToken,
  signal,
}: AccountRequestOptions): Promise<AccountOrderPayload[]> {
  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/account/orders`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiRequestError(
      extractApiError(payload, "Lecture commandes impossible"),
      response.status,
    );
  }

  if (typeof payload !== "object" || payload === null || !("orders" in payload)) {
    return [];
  }
  const maybeOrders = (payload as { orders?: unknown }).orders;
  return Array.isArray(maybeOrders) ? (maybeOrders as AccountOrderPayload[]) : [];
}

export function startGoogleOAuth(apiBaseUrl?: string): void {
  window.location.assign(`${resolveApiBaseUrl(apiBaseUrl)}/auth/google/start`);
}
