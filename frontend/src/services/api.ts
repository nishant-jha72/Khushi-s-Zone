const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface Product {
  id: string;
  itemId?: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  isNew?: boolean;
  rating?: number;
  description?: string;
  sizes?: string[];
  type?: string;
}

let accessToken: string | null = localStorage.getItem("kz_access_token");
let refreshToken: string | null = localStorage.getItem("kz_refresh_token");

export const setTokens = (access: string | null, refresh: string | null) => {
  accessToken = access;
  refreshToken = refresh;
  if (access) {
    localStorage.setItem("kz_access_token", access);
  } else {
    localStorage.removeItem("kz_access_token");
  }
  if (refresh) {
    localStorage.setItem("kz_refresh_token", refresh);
  } else {
    localStorage.removeItem("kz_refresh_token");
  }
};

export const getAccessToken = () =>
  accessToken || localStorage.getItem("kz_access_token");
export const getRefreshToken = () =>
  refreshToken || localStorage.getItem("kz_refresh_token");

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<any> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && getRefreshToken()) {
    const refreshResult = await refreshTokens();
    if (refreshResult.success) {
      headers["Authorization"] = `Bearer ${refreshResult.accessToken}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      setTokens(null, null);
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`,
    );
  }
  return data;
}

async function refreshTokens(): Promise<{
  success: boolean;
  accessToken?: string;
}> {
  try {
    const curRefresh = getRefreshToken();
    if (!curRefresh) return { success: false };

    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: curRefresh }),
    });

    const data = await res.json();
    if (res.ok && data.accessToken) {
      setTokens(data.accessToken, data.refreshToken || curRefresh);
      return { success: true, accessToken: data.accessToken };
    }
  } catch (err) {
    console.error("Failed to refresh token:", err);
  }
  return { success: false };
}

export async function registerApi(payload: {
  name: string;
  email: string;
  password: string;
}) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmailApi(token: string) {
  const res = await apiFetch("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  if (res.accessToken && res.refreshToken) {
    setTokens(res.accessToken, res.refreshToken);
  }
  return res;
}

export async function loginApi(payload: { email: string; password: string }) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (res.accessToken && res.refreshToken) {
    setTokens(res.accessToken, res.refreshToken);
  }
  return res;
}

export async function googleLoginApi(credential: string) {
  const res = await apiFetch("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
  if (res.accessToken && res.refreshToken) {
    setTokens(res.accessToken, res.refreshToken);
  }
  return res;
}

export async function logoutApi() {
  const curRefresh = getRefreshToken();
  try {
    if (curRefresh) {
      await apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: curRefresh }),
      });
    }
  } finally {
    setTokens(null, null);
  }
}

export async function getMeApi() {
  return apiFetch("/auth/me");
}

export async function getProfileApi() {
  return apiFetch("/user/profile");
}

export async function updateProfileApi(profileData: {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) {
  return apiFetch("/user/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}

export async function getOrdersApi() {
  return apiFetch("/orders");
}

export async function placeOrderApi(orderData: {
  items: any[];
  shippingAddress: string;
  paymentMethod: string;
}) {
  return apiFetch("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

export async function getCartApi() {
  return apiFetch("/cart");
}

export async function addToCartApi(
  itemId: string | number,
  quantity: number = 1,
  size: string = "M",
) {
  return apiFetch("/cart", {
    method: "POST",
    body: JSON.stringify({ itemId, quantity, size }),
  });
}

export async function updateCartItemApi(cartItemId: number, quantity: number) {
  return apiFetch(`/cart/${cartItemId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeFromCartApi(cartItemId: number) {
  return apiFetch(`/cart/${cartItemId}`, {
    method: "DELETE",
  });
}

export async function getWishlistApi() {
  return apiFetch("/wishlist");
}

export async function toggleWishlistApi(itemId: string | number) {
  return apiFetch("/wishlist/toggle", {
    method: "POST",
    body: JSON.stringify({ itemId }),
  });
}

export async function getProductsApi(category?: string, search?: string) {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (search) params.append("search", search);
  const queryString = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/products${queryString}`);
}

export async function getCategoriesApi() {
  return apiFetch("/categories");
}

export async function getProductDetailApi(id: string | number) {
  return apiFetch(`/products/${id}`);
}

export async function getMyOrdersApi() {
  return apiFetch("/orders/my-orders");
}

export async function getOrderByIdApi(orderId: string | number) {
  return apiFetch(`/orders/${orderId}`);
}

export async function getOrderTrackingApi(orderId: string | number) {
  return apiFetch(`/orders/${orderId}/tracking`);
}
