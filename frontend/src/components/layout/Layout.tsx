import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import AuthModal from "../auth/AuthModal";
import CheckoutModal from "../checkout/CheckoutModal";
import { useAuth } from "../../context/AuthContext";
import { X, ShoppingBag, Heart } from "lucide-react";
import type { Product } from "../../services/api";
import type { LayoutContextType } from "./useLayout";

export default function Layout() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    cartItems,
    wishlist,
    wishlistedProducts,
    totalCartCount,
    totalCartPrice,
    addToCart,
    removeFromCart,
    toggleWishlist,
    verifyEmail,
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  // Handle email verification link: ?verify_token=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("verify_token");
    if (!token) return;

    let cancelled = false;

    const runVerify = async () => {
      try {
        const res = await verifyEmail(token);
        if (!cancelled && res.success) {
          setVerifyNotice("Email verified! Welcome to Khushi's Zone.");
        }
      } catch (err: any) {
        if (!cancelled) {
          setVerifyNotice(
            err.message || "Verification failed. Please try again.",
          );
          setIsAuthOpen(true);
          setAuthMode("login");
        }
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete("verify_token");
        window.history.replaceState({}, "", url.pathname + url.search);
        if (!cancelled) {
          setTimeout(() => setVerifyNotice(null), 5000);
        }
      }
    };
    runVerify();
    return () => {
      cancelled = true;
    };
  }, [verifyEmail]);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      setAuthMode("login");
      setIsAuthOpen(true);
      return;
    }
    action();
  };

  const handleToggleWishlist = (productId: string | number) => {
    requireAuth(async () => {
      try {
        await toggleWishlist(productId);
      } catch (err: any) {
        console.error(err);
        setIsAuthOpen(true);
      }
    });
  };

  const handleAddToCart = (product: Product) => {
    requireAuth(async () => {
      try {
        await addToCart(product);
      } catch (err: any) {
        console.error(err);
        setIsAuthOpen(true);
      }
    });
  };

  const handleRemoveFromCart = (cartItemId: number) => {
    requireAuth(async () => {
      await removeFromCart(cartItemId);
    });
  };

  const openCart = () => requireAuth(() => setIsCartOpen(true));
  const openWishlist = () => requireAuth(() => setIsWishlistOpen(true));
  const openAuth = (mode: "login" | "signup" = "login") => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };
  const openCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const contextValue: LayoutContextType = {
    openCart,
    openWishlist,
    openAuth,
    openCheckout,
    searchQuery,
    setSearchQuery,
  };

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#4A2925] font-sans antialiased flex flex-col selection:bg-[#4A2925] selection:text-white">
      <Header
        wishlistCount={wishlist.length}
        cartCount={totalCartCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCart={openCart}
        onOpenWishlist={openWishlist}
        onOpenLogin={() => openAuth("login")}
        onOpenAccount={(tab) =>
          navigate(tab ? `/account?tab=${tab}` : "/account")
        }
        onOpenAdmin={() => navigate("/admin")}
        onSelectCategory={(slug) => navigate(`/category/${slug}`)}
      />

      {verifyNotice && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-medium text-center py-3 px-4">
          {verifyNotice}
        </div>
      )}

      <main className="flex-1">
        <Outlet context={contextValue} />
      </main>

      <Footer />

      {/* Slide-out Shopping Bag Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col justify-between z-10 border-l border-[#EDE5D5]">
            <div className="p-5 border-b border-[#EDE5D5] flex items-center justify-between bg-[#F7F2EA]">
              <div className="flex items-center space-x-2 text-[#4A2925]">
                <ShoppingBag className="w-5 h-5" />
                <h2 className="text-xs font-bold tracking-widest uppercase">
                  Shopping Bag ({totalCartCount})
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-[#8C7A6B] hover:text-[#4A2925]"
                aria-label="Close bag"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 divide-y divide-[#EDE5D5]">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 text-[#8C7A6B] space-y-3">
                  <ShoppingBag className="w-12 h-12 mx-auto opacity-30 text-[#4A2925]" />
                  <p className="text-sm font-medium">
                    Your shopping bag is empty.
                  </p>
                  <p className="text-xs">
                    Explore our collections and add your favorite pieces!
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.cartItemId} className="py-4 flex space-x-4">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-20 object-cover rounded-md border border-[#EDE5D5]"
                    />
                    <div className="flex-1 space-y-1 text-left">
                      <h4 className="font-serif text-xs font-semibold text-[#4A2925]">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-[#8C7A6B]">
                        Qty: {item.quantity} · Size: {item.size}
                      </p>
                      <p className="text-xs font-bold text-[#4A2925]">
                        ₹{" "}
                        {(item.product.price * item.quantity).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.cartItemId)}
                      className="text-xs text-red-700 hover:underline self-start cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 border-t border-[#EDE5D5] bg-[#F7F2EA] space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-[#4A2925]">
                  <span>Subtotal</span>
                  <span>₹ {totalCartPrice.toLocaleString("en-IN")}</span>
                </div>
                <p className="text-[10px] text-[#8C7A6B] text-center">
                  Taxes and shipping calculated at checkout
                </p>
                <button
                  onClick={openCheckout}
                  className="w-full py-3 bg-[#4A2925] text-white text-xs font-semibold tracking-widest uppercase rounded-full hover:bg-[#3D211E] transition-colors cursor-pointer"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-out Wishlist Drawer */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsWishlistOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col justify-between z-10 border-l border-[#EDE5D5]">
            <div className="p-5 border-b border-[#EDE5D5] flex items-center justify-between bg-[#F7F2EA]">
              <div className="flex items-center space-x-2 text-[#4A2925]">
                <Heart className="w-5 h-5 fill-[#4A2925]" />
                <h2 className="text-xs font-bold tracking-widest uppercase">
                  Your Wishlist ({wishlistedProducts.length})
                </h2>
              </div>
              <button
                onClick={() => setIsWishlistOpen(false)}
                className="p-1 text-[#8C7A6B] hover:text-[#4A2925]"
                aria-label="Close wishlist"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 divide-y divide-[#EDE5D5]">
              {wishlistedProducts.length === 0 ? (
                <div className="text-center py-16 text-[#8C7A6B] space-y-3">
                  <Heart className="w-12 h-12 mx-auto opacity-30 text-[#4A2925]" />
                  <p className="text-sm font-medium">Your wishlist is empty.</p>
                  <p className="text-xs">
                    Click the heart icon on any product to save it here!
                  </p>
                </div>
              ) : (
                wishlistedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="py-4 flex space-x-4 items-center"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-20 object-cover rounded-md border border-[#EDE5D5]"
                    />
                    <div className="flex-1 space-y-1 text-left">
                      <h4 className="font-serif text-xs font-semibold text-[#4A2925]">
                        {product.name}
                      </h4>
                      <p className="text-xs font-bold text-[#4A2925]">
                        ₹ {product.price.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="space-y-2 text-right">
                      <button
                        onClick={() => {
                          handleAddToCart(product);
                          setIsWishlistOpen(false);
                          setIsCartOpen(true);
                        }}
                        className="px-3 py-1 bg-[#4A2925] text-white text-[10px] font-semibold rounded-full uppercase hover:bg-[#3D211E] cursor-pointer"
                      >
                        Add to Bag
                      </button>
                      <button
                        onClick={() => handleToggleWishlist(product.id)}
                        className="block text-[10px] text-red-700 hover:underline w-full text-right cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderPlaced={() => {
          setIsCheckoutOpen(false);
          navigate("/account?tab=orders");
        }}
      />
    </div>
  );
}
