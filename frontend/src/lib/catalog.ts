import { ApiRequestError } from "./auth";

export interface CatalogCollectionPayload {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CatalogCollectionRefPayload {
  id: string | null;
  slug: string;
  title: string;
}

export interface CatalogProductPayload {
  id: string;
  slug: string;
  name: string;
  collection_id: string;
  collection: CatalogCollectionRefPayload;
  price: number;
  description: string;
  size_guide: string[];
  stock: number;
  composition_care: string[];
  images: string[];
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CatalogFeaturedPayload {
  signature_product_id: string | null;
  best_seller_product_ids: string[];
  updated_at?: string | null;
}

export interface CatalogPayload {
  collections: CatalogCollectionPayload[];
  products: CatalogProductPayload[];
  featured: CatalogFeaturedPayload;
}

interface CatalogRequestOptions {
  apiBaseUrl?: string;
  signal?: AbortSignal;
}

interface CatalogAdminRequestOptions extends CatalogRequestOptions {
  accessToken: string;
}

interface CreateCollectionPayload {
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  slug?: string | null;
}

interface UpdateCollectionPayload {
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  slug?: string | null;
}

interface CreateProductPayload {
  name: string;
  collection_id: string;
  price: number;
  description: string;
  size_guide: string[];
  stock: number;
  composition_care: string[];
  images: string[];
  is_active: boolean;
  slug?: string | null;
}

interface UpdateProductPayload {
  name?: string | null;
  collection_id?: string | null;
  price?: number | null;
  description?: string | null;
  size_guide?: string[] | null;
  stock?: number | null;
  composition_care?: string[] | null;
  images?: string[] | null;
  is_active?: boolean | null;
  slug?: string | null;
}

interface UpdateFeaturedPayload {
  signature_product_id: string | null;
  best_seller_product_ids: string[];
}

interface UploadImageOptions extends CatalogAdminRequestOptions {
  file: File;
  scope: "collections" | "products";
}

export interface UploadImagePayload {
  path: string;
  image_url: string;
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

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function normalizeCatalogCollection(value: unknown): CatalogCollectionPayload {
  const collection = typeof value === "object" && value !== null ? value : {};
  const data = collection as Record<string, unknown>;

  return {
    id: typeof data.id === "string" ? data.id : "",
    slug: typeof data.slug === "string" ? data.slug : "",
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    image_url: typeof data.image_url === "string" ? data.image_url : "",
    sort_order: typeof data.sort_order === "number" ? data.sort_order : 0,
    is_active: typeof data.is_active === "boolean" ? data.is_active : true,
    created_at: typeof data.created_at === "string" ? data.created_at : null,
    updated_at: typeof data.updated_at === "string" ? data.updated_at : null,
  };
}

function normalizeCollectionRef(value: unknown): CatalogCollectionRefPayload {
  const collection = typeof value === "object" && value !== null ? value : {};
  const data = collection as Record<string, unknown>;

  return {
    id: typeof data.id === "string" ? data.id : null,
    slug: typeof data.slug === "string" ? data.slug : "",
    title: typeof data.title === "string" ? data.title : "",
  };
}

function normalizeCatalogProduct(value: unknown): CatalogProductPayload {
  const product = typeof value === "object" && value !== null ? value : {};
  const data = product as Record<string, unknown>;

  const parsedPrice = Number(data.price);

  return {
    id: typeof data.id === "string" ? data.id : "",
    slug: typeof data.slug === "string" ? data.slug : "",
    name: typeof data.name === "string" ? data.name : "",
    collection_id: typeof data.collection_id === "string" ? data.collection_id : "",
    collection: normalizeCollectionRef(data.collection),
    price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    description: typeof data.description === "string" ? data.description : "",
    size_guide: normalizeStringArray(data.size_guide),
    stock: typeof data.stock === "number" ? data.stock : 0,
    composition_care: normalizeStringArray(data.composition_care),
    images: normalizeStringArray(data.images),
    is_active: typeof data.is_active === "boolean" ? data.is_active : true,
    created_at: typeof data.created_at === "string" ? data.created_at : null,
    updated_at: typeof data.updated_at === "string" ? data.updated_at : null,
  };
}

function normalizeCatalogFeatured(value: unknown): CatalogFeaturedPayload {
  const featured = typeof value === "object" && value !== null ? value : {};
  const data = featured as Record<string, unknown>;

  return {
    signature_product_id:
      typeof data.signature_product_id === "string" ? data.signature_product_id : null,
    best_seller_product_ids: normalizeStringArray(data.best_seller_product_ids),
    updated_at: typeof data.updated_at === "string" ? data.updated_at : null,
  };
}

function normalizeCatalogPayload(payload: unknown): CatalogPayload {
  const root = typeof payload === "object" && payload !== null ? payload : {};
  const data = root as Record<string, unknown>;

  return {
    collections: Array.isArray(data.collections)
      ? data.collections.map(normalizeCatalogCollection).filter((item) => item.id.length > 0)
      : [],
    products: Array.isArray(data.products)
      ? data.products.map(normalizeCatalogProduct).filter((item) => item.id.length > 0)
      : [],
    featured: normalizeCatalogFeatured(data.featured),
  };
}

async function adminJsonRequest<T>(
  path: string,
  {
    apiBaseUrl,
    accessToken,
    signal,
    method,
    body,
    fallback,
  }: CatalogAdminRequestOptions & {
    method: "POST" | "PUT";
    body: Record<string, unknown>;
    fallback: string;
  },
): Promise<T> {
  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiRequestError(extractApiError(payload, fallback), response.status);
  }

  return payload as T;
}

export async function getPublicCatalog({
  apiBaseUrl,
  signal,
}: CatalogRequestOptions = {}): Promise<CatalogPayload> {
  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/catalog/public`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiRequestError(extractApiError(payload, "Lecture catalogue impossible"), response.status);
  }

  return normalizeCatalogPayload(payload);
}

export async function getAdminCatalog({
  apiBaseUrl,
  accessToken,
  signal,
}: CatalogAdminRequestOptions): Promise<CatalogPayload> {
  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/catalog/admin`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiRequestError(extractApiError(payload, "Lecture admin impossible"), response.status);
  }

  return normalizeCatalogPayload(payload);
}

export async function createAdminCollection(
  options: CatalogAdminRequestOptions & CreateCollectionPayload,
): Promise<CatalogCollectionPayload> {
  const payload = await adminJsonRequest<Record<string, unknown>>("/catalog/admin/collections", {
    ...options,
    method: "POST",
    fallback: "Creation collection impossible",
    body: {
      title: options.title,
      description: options.description,
      image_url: options.image_url,
      sort_order: options.sort_order,
      is_active: options.is_active,
      slug: options.slug ?? null,
    },
  });

  return normalizeCatalogCollection(payload);
}

export async function updateAdminCollection(
  collectionId: string,
  options: CatalogAdminRequestOptions & UpdateCollectionPayload,
): Promise<CatalogCollectionPayload> {
  const payload = await adminJsonRequest<Record<string, unknown>>(
    `/catalog/admin/collections/${collectionId}`,
    {
      ...options,
      method: "PUT",
      fallback: "Mise a jour collection impossible",
      body: {
        title: options.title ?? null,
        description: options.description ?? null,
        image_url: options.image_url ?? null,
        sort_order: options.sort_order ?? null,
        is_active: options.is_active ?? null,
        slug: options.slug ?? null,
      },
    },
  );

  return normalizeCatalogCollection(payload);
}

export async function createAdminProduct(
  options: CatalogAdminRequestOptions & CreateProductPayload,
): Promise<CatalogProductPayload> {
  const payload = await adminJsonRequest<Record<string, unknown>>("/catalog/admin/products", {
    ...options,
    method: "POST",
    fallback: "Creation produit impossible",
    body: {
      name: options.name,
      collection_id: options.collection_id,
      price: options.price,
      description: options.description,
      size_guide: options.size_guide,
      stock: options.stock,
      composition_care: options.composition_care,
      images: options.images,
      is_active: options.is_active,
      slug: options.slug ?? null,
    },
  });

  return normalizeCatalogProduct(payload);
}

export async function updateAdminProduct(
  productId: string,
  options: CatalogAdminRequestOptions & UpdateProductPayload,
): Promise<CatalogProductPayload> {
  const payload = await adminJsonRequest<Record<string, unknown>>(
    `/catalog/admin/products/${productId}`,
    {
      ...options,
      method: "PUT",
      fallback: "Mise a jour produit impossible",
      body: {
        name: options.name ?? null,
        collection_id: options.collection_id ?? null,
        price: options.price ?? null,
        description: options.description ?? null,
        size_guide: options.size_guide ?? null,
        stock: options.stock ?? null,
        composition_care: options.composition_care ?? null,
        images: options.images ?? null,
        is_active: options.is_active ?? null,
        slug: options.slug ?? null,
      },
    },
  );

  return normalizeCatalogProduct(payload);
}

export async function updateAdminFeatured(
  options: CatalogAdminRequestOptions & UpdateFeaturedPayload,
): Promise<CatalogFeaturedPayload> {
  const payload = await adminJsonRequest<Record<string, unknown>>("/catalog/admin/featured", {
    ...options,
    method: "PUT",
    fallback: "Mise a jour best-sellers impossible",
    body: {
      signature_product_id: options.signature_product_id,
      best_seller_product_ids: options.best_seller_product_ids,
    },
  });

  return normalizeCatalogFeatured(payload);
}

export async function uploadAdminImage({
  apiBaseUrl,
  accessToken,
  signal,
  file,
  scope,
}: UploadImageOptions): Promise<UploadImagePayload> {
  const formData = new FormData();
  formData.append("scope", scope);
  formData.append("file", file);

  const response = await fetch(`${resolveApiBaseUrl(apiBaseUrl)}/catalog/admin/upload-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    body: formData,
    signal,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiRequestError(extractApiError(payload, "Upload image impossible"), response.status);
  }

  if (typeof payload !== "object" || payload === null) {
    throw new ApiRequestError("Upload image impossible", response.status);
  }

  const imageUrl = (payload as { image_url?: unknown }).image_url;
  const imagePath = (payload as { path?: unknown }).path;

  if (typeof imageUrl !== "string" || typeof imagePath !== "string") {
    throw new ApiRequestError("Payload upload invalide", response.status);
  }

  return {
    path: imagePath,
    image_url: imageUrl,
  };
}
