import { useOutletContext } from "react-router-dom";

export interface LayoutContextType {
  openCart: () => void;
  openWishlist: () => void;
  openAuth: (mode?: "login" | "signup") => void;
  openCheckout: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function useLayout() {
  return useOutletContext<LayoutContextType>();
}
