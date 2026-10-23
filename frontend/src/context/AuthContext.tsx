import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getMeApi,
  loginApi,
  registerApi,
  verifyEmailApi,
  googleLoginApi,
  logoutApi,
  getCartApi,
  addToCartApi,
  removeFromCartApi,
  getWishlistApi,
  toggleWishlistApi,
  updateProfileApi,
  placeOrderApi,
  getAccessToken,
  type Product,
} from "../services/api";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  avatar?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
}

export interface CartEntry {
  cartItemId: number;
  quantity: number;
  size: string;
  product: Product;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  cartItems: CartEntry[];
  wishlist: string[];
  wishlistedProducts: Product[];
  totalCartCount: number;
  totalCartPrice: number;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<any>;
  verifyEmail: (token: string) => Promise<any>;
  googleLogin: (credential: string) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<any>;
  addToCart: (
    product: Product,
    quantity?: number,
    size?: string,
  ) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  toggleWishlist: (productId: string | number) => Promise<void>;
  fetchCartAndWishlist: () => Promise<void>;
  placeOrder: (orderData: {
    items: Array<{
      itemId?: string | number;
      id?: string | number;
      name?: string;
      price: number;
      quantity: number;
      size?: string;
    }>;
    shippingAddress: string;
    paymentMethod: string;
  }) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cartItems, setCartItems] = useState<CartEntry[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistedProducts, setWishlistedProducts] = useState<Product[]>([]);

  const fetchCartAndWishlist = async () => {
    if (!getAccessToken()) return;
    try {
      const [cartRes, wishlistRes] = await Promise.all([
        getCartApi().catch(() => null),
        getWishlistApi().catch(() => null),
      ]);

      if (cartRes && cartRes.success) {
        setCartItems(cartRes.items || []);
      }
      if (wishlistRes && wishlistRes.success) {
        setWishlist(wishlistRes.wishlist || []);
        setWishlistedProducts(wishlistRes.products || []);
      }
    } catch (err) {
      console.error("Failed to sync Cart & Wishlist with DB:", err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const res = await getMeApi();
          if (res.success && res.user) {
            setUser(res.user);
            await fetchCartAndWishlist();
          }
        } catch (err) {
          console.error("Session initialization failed:", err);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await loginApi(credentials);
    if (res.success && res.user) {
      setUser(res.user);
      await fetchCartAndWishlist();
    }
    return res;
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    return await registerApi(data);
  };

  const verifyEmail = async (token: string) => {
    const res = await verifyEmailApi(token);
    if (res.success && res.user) {
      setUser(res.user);
      await fetchCartAndWishlist();
    }
    return res;
  };

  const googleLogin = async (credential: string) => {
    const res = await googleLoginApi(credential);
    if (res.success && res.user) {
      setUser(res.user);
      await fetchCartAndWishlist();
    }
    return res;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setCartItems([]);
      setWishlist([]);
      setWishlistedProducts([]);
    }
  };

  const updateProfile = async (data: any) => {
    const res = await updateProfileApi(data);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const addToCart = async (product: Product, quantity = 1, size = "M") => {
    if (!user) {
      throw new Error("Please sign in to add items to your bag.");
    }
    await addToCartApi(product.itemId || product.id, quantity, size);
    await fetchCartAndWishlist();
  };

  const removeFromCart = async (cartItemId: number) => {
    if (!user) return;
    await removeFromCartApi(cartItemId);
    await fetchCartAndWishlist();
  };

  const toggleWishlist = async (productId: string | number) => {
    if (!user) {
      throw new Error("Please sign in to manage your wishlist.");
    }
    await toggleWishlistApi(productId);
    await fetchCartAndWishlist();
  };

  const placeOrder = async (orderData: {
    items: Array<{
      itemId?: string | number;
      id?: string | number;
      name?: string;
      price: number;
      quantity: number;
      size?: string;
    }>;
    shippingAddress: string;
    paymentMethod: string;
  }) => {
    if (!user) {
      throw new Error("Please sign in to place an order.");
    }
    const res = await placeOrderApi(orderData);
    await fetchCartAndWishlist();
    return res;
  };

  const totalCartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const totalCartPrice = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        cartItems,
        wishlist,
        wishlistedProducts,
        totalCartCount,
        totalCartPrice,
        login,
        register,
        verifyEmail,
        googleLogin,
        logout,
        updateProfile,
        addToCart,
        removeFromCart,
        toggleWishlist,
        fetchCartAndWishlist,
        placeOrder,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
