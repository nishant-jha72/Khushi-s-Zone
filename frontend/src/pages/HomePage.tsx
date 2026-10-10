import { useState, useEffect, useMemo } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/home/HeroSection";
import TrustBar from "../components/home/TrustBar";
import CategoryGrid from "../components/home/CategoryGrid";
import FeaturedProducts from "../components/home/FeaturedProducts";
import BrandStory from "../components/home/BrandStory";
import AuthModal from "../components/auth/AuthModal";
import { useAuth } from "../context/AuthContext";
import { getProductsApi, type Product } from "../services/api";
import { X, ShoppingBag, Heart } from "lucide-react";

interface HomePageProps {
  onOpenAccount: (tab?: string) => void;
  onOpenAdmin?: () => void;
  onSelectCategory?: (categorySlug: string) => void;
  onSelectProduct?: (productId: string) => void;
}

export default function HomePage({
  onOpenAccount,
  onOpenAdmin,
  onSelectCategory,
  onSelectProduct,
}: HomePageProps) {
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

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await getProductsApi(selectedCategory || undefined, searchQuery || undefined);
        if (res.success && res.products) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setProductsLoading(false);
      }
    };
    loadProducts();
  }, [selectedCategory, searchQuery]);

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
          setVerifyNotice(err.message || "Verification failed. Please try again.");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for email link
  }, []);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      setAuthMode("login");
      setIsAuthOpen(true);
      return;
    }
    action();
  };

  const handleToggleWishlist = (productId: string) => {
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

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#4A2925] font-sans antialiased flex flex-col selection:bg-[#4A2925] selection:text-white">
      <Header
        wishlistCount={wishlist.length}
        cartCount={totalCartCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCart={() =>
          requireAuth(() => setIsCartOpen(true))
        }
        onOpenWishlist={() =>
          requireAuth(() => setIsWishlistOpen(true))
        }
        onOpenLogin={() => {
          setAuthMode("login");
          setIsAuthOpen(true);
        }}
        onOpenAccount={onOpenAccount}
        onOpenAdmin={onOpenAdmin}
        onSelectCategory={(slug) => {
          if (onSelectCategory) {
            onSelectCategory(slug);
          } else {
            setSelectedCategory(slug === selectedCategory ? null : slug);
          }
        }}
      />

      {verifyNotice && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-medium text-center py-3 px-4">
          {verifyNotice}
        </div>
      )}

      <main className="flex-1">
        {(selectedCategory || searchQuery) && (
          <div className="bg-[#EDE5D5] py-3 px-6 text-center text-xs font-semibold tracking-wider text-[#4A2925] flex items-center justify-center space-x-3 border-b border-[#D9CEB9]">
            <span>
              FILTERING BY: {selectedCategory ? selectedCategory.toUpperCase() : ""}{" "}
              {searchQuery ? `"${searchQuery}"` : ""}
            </span>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery("");
              }}
              className="px-2.5 py-0.5 bg-[#4A2925] text-white text-[10px] rounded-full uppercase hover:bg-[#3D211E] transition-colors"
            >
              Clear Filter
            </button>
          </div>
        )}

        <HeroSection
          onExploreClick={() => {
            const el = document.getElementById("featured-products");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        <TrustBar />

        <CategoryGrid
          onSelectCategory={(slug) => {
            if (onSelectCategory) {
              onSelectCategory(slug);
            } else {
              setSelectedCategory(slug);
            }
          }}
        />

        <div id="featured-products">
          {productsLoading ? (
            <div className="py-20 text-center text-xs text-[#8C7A6B]">Loading collection...</div>
          ) : (
            <FeaturedProducts
              products={filteredProducts}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onSelectProduct={onSelectProduct}
            />
          )}
        </div>

        <BrandStory />
      </main>

      <Footer />

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
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 divide-y divide-[#EDE5D5]">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 text-[#8C7A6B] space-y-3">
                  <ShoppingBag className="w-12 h-12 mx-auto opacity-30 text-[#4A2925]" />
                  <p className="text-sm font-medium">Your shopping bag is empty.</p>
                  <p className="text-xs">Explore our collections and add your favorite pieces!</p>
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
                        ₹ {(item.product.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.cartItemId)}
                      className="text-xs text-red-700 hover:underline self-start"
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
                  onClick={() => {
                    setIsCartOpen(false);
                    onOpenAccount("orders");
                  }}
                  className="w-full py-3 bg-[#4A2925] text-white text-xs font-semibold tracking-widest uppercase rounded-full hover:bg-[#3D211E] transition-colors"
                >
                  VIEW ACCOUNT / ORDERS
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 divide-y divide-[#EDE5D5]">
              {wishlistedProducts.length === 0 ? (
                <div className="text-center py-16 text-[#8C7A6B] space-y-3">
                  <Heart className="w-12 h-12 mx-auto opacity-30 text-[#4A2925]" />
                  <p className="text-sm font-medium">Your wishlist is empty.</p>
                  <p className="text-xs">Click the heart icon on any product to save it here!</p>
                </div>
              ) : (
                wishlistedProducts.map((product) => (
                  <div key={product.id} className="py-4 flex space-x-4 items-center">
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
                        className="px-3 py-1 bg-[#4A2925] text-white text-[10px] font-semibold rounded-full uppercase hover:bg-[#3D211E]"
                      >
                        Add to Bag
                      </button>
                      <button
                        onClick={() => handleToggleWishlist(product.id)}
                        className="block text-[10px] text-red-700 hover:underline w-full text-right"
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
