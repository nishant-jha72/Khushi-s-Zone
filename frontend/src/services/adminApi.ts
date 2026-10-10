const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// --- Helper to get the auth token ---
function getAuthToken(): string | null {
  return localStorage.getItem("kz_access_token");
}

async function adminFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData — browser sets it with boundary
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

// ─── Product CRUD ────────────────────────────────────────────────────────────

export interface CreateProductPayload {
  name: string;
  categoryId: number | null;
  description: string;
  price: number;
  originalPrice?: number | null;
  sizes?: string[];
  type?: string;
  imageUrl?: string;
  rating?: number;
  isBestseller?: boolean;
  sku?: string;
  brand?: string;
  material?: string;
  careInstructions?: string;
  stockStatus?: string;
}

export async function createProductApi(data: CreateProductPayload) {
  return adminFetch("/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProductApi(id: number, data: Partial<CreateProductPayload>) {
  return adminFetch(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProductApi(id: number) {
  return adminFetch(`/products/${id}`, {
    method: "DELETE",
  });
}

export async function setProductStatusApi(id: number, isActive: boolean) {
  return adminFetch(`/products/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function getAllProductsAdminApi(page = 1, limit = 50) {
  return adminFetch(`/products?page=${page}&limit=${limit}`);
}

// ─── Media ───────────────────────────────────────────────────────────────────

export async function uploadProductMediaApi(productId: number, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("media", file));

  return adminFetch(`/products/${productId}/media`, {
    method: "POST",
    body: formData,
  });
}

export async function deleteProductMediaApi(productId: number, mediaId: number) {
  return adminFetch(`/products/${productId}/media/${mediaId}`, {
    method: "DELETE",
  });
}

export async function getProductMediaApi(productId: number) {
  return adminFetch(`/products/${productId}/media`);
}

// ─── Colors ──────────────────────────────────────────────────────────────────

export async function addProductColorApi(productId: number, colorName: string, hexCode?: string) {
  return adminFetch(`/products/${productId}/colors`, {
    method: "POST",
    body: JSON.stringify({ colorName, hexCode }),
  });
}

// ─── Variants ────────────────────────────────────────────────────────────────

export interface VariantPayload {
  colorId?: number | null;
  size: string;
  sku?: string;
  price?: number;
  originalPrice?: number;
  stockQuantity?: number;
  supplierSku?: string;
}

export async function upsertVariantApi(productId: number, data: VariantPayload) {
  return adminFetch(`/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategoriesApi() {
  return adminFetch("/categories");
}
