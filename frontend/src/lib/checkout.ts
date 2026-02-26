import { ApiRequestError } from "./auth";

export interface CheckoutLineItemInput {
  product_id: string;
  quantity: number;
  size?: string | null;
}

export interface CheckoutSessionPayload {
  session_id: string;
  checkout_url: string;
}

export interface CheckoutSessionSyncPayload {
  payment_status: string;
  order_recorded: boolean;
  order_number: string | null;
}

interface CreateCheckoutSessionOptions {
  apiBaseUrl?: string;
  signal?: AbortSignal;
  idempotencyKey?: string;
  accessToken?: string;
  items: CheckoutLineItemInput[];
}

interface SyncCheckoutSessionOptions {
  apiBaseUrl?: string;
  signal?: AbortSignal;
  accessToken?: string;
  sessionId: string;
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

export async function createCheckoutSession({
  apiBaseUrl,
  signal,
  idempotencyKey,
  accessToken,
  items,
}: CreateCheckoutSessionOptions): Promise<CheckoutSessionPayload> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (typeof idempotencyKey === "string" && idempotencyKey.trim().length > 0) {
    headers["Idempotency-Key"] = idempotencyKey.trim();
  }
  if (typeof accessToken === "string" && accessToken.trim().length > 0) {
    headers.Authorization = `Bearer ${accessToken.trim()}`;
  }

  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/checkout/session`, {
    method: "POST",
    headers,
    body: JSON.stringify({ items }),
    signal,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiRequestError(
      extractApiError(payload, "Paiement indisponible"),
      response.status,
    );
  }

  if (typeof payload !== "object" || payload === null) {
    throw new ApiRequestError("Session checkout invalide", response.status);
  }

  const sessionId = (payload as { session_id?: unknown }).session_id;
  const checkoutUrl = (payload as { checkout_url?: unknown }).checkout_url;

  if (typeof sessionId !== "string" || typeof checkoutUrl !== "string") {
    throw new ApiRequestError("Session checkout invalide", response.status);
  }

  return {
    session_id: sessionId,
    checkout_url: checkoutUrl,
  };
}

export async function syncCheckoutSessionOrder({
  apiBaseUrl,
  signal,
  accessToken,
  sessionId,
}: SyncCheckoutSessionOptions): Promise<CheckoutSessionSyncPayload> {
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    throw new ApiRequestError("Session checkout invalide", 422);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (typeof accessToken === "string" && accessToken.trim().length > 0) {
    headers.Authorization = `Bearer ${accessToken.trim()}`;
  }

  const response = await fetch(
    `${resolveApiBaseUrl(apiBaseUrl)}/checkout/session/${encodeURIComponent(sessionId.trim())}/sync`,
    {
      method: "POST",
      headers,
      signal,
    },
  );

  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw new ApiRequestError(
      extractApiError(payload, "Vérification paiement impossible"),
      response.status,
    );
  }

  if (typeof payload !== "object" || payload === null) {
    throw new ApiRequestError("Session checkout invalide", response.status);
  }

  const paymentStatus = (payload as { payment_status?: unknown }).payment_status;
  const orderRecorded = (payload as { order_recorded?: unknown }).order_recorded;
  const orderNumber = (payload as { order_number?: unknown }).order_number;

  if (typeof paymentStatus !== "string" || typeof orderRecorded !== "boolean") {
    throw new ApiRequestError("Session checkout invalide", response.status);
  }

  return {
    payment_status: paymentStatus,
    order_recorded: orderRecorded,
    order_number: typeof orderNumber === "string" ? orderNumber : null,
  };
}
