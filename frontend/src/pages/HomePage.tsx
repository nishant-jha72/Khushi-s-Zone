import { useState, useMemo } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/home/HeroSection";
import TrustBar from "../components/home/TrustBar";
import CategoryGrid from "../components/home/CategoryGrid";
import FeaturedProducts from "../components/home/FeaturedProducts";
import BrandStory from "../components/home/BrandStory";
import { MOCK_PRODUCTS, type Product } from "../data/mockProducts";
import { X, ShoppingBag, Heart } from "lucide-react";

export default function HomePage() {
  // Frontend State
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modals & Drawers State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Handlers
  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Filtered Products based on search query & category filter
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const totalCartPrice = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const wishlistedProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => wishlist.includes(p.id));
  }, [wishlist]);

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#4A2925] font-sans antialiased flex flex-col selection:bg-[#4A2925] selection:text-white">
      {/* Navbar Header */}
      <Header
        wishlistCount={wishlist.length}
        cartCount={totalCartCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onSelectCategory={(slug) => {
          setSelectedCategory(slug === selectedCategory ? null : slug);
          const el = document.getElementById("featured-products");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Active Filter Notification if category or search active */}
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

        {/* A. Hero Section */}
        <HeroSection
          onExploreClick={() => {
            const el = document.getElementById("featured-products");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* B. Trust Bar */}
        <TrustBar />

        {/* C. Shop by Category */}
        <CategoryGrid
          onSelectCategory={(slug) => {
            setSelectedCategory(slug);
            const el = document.getElementById("featured-products");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* D. Featured Products */}
        <div id="featured-products">
          <FeaturedProducts
            products={filteredProducts}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* E. Brand Story */}
        <BrandStory />
      </main>

      {/* Footer */}
      <Footer />

      {/* Slide-over Cart Drawer */}
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
                  <div key={item.product.id} className="py-4 flex space-x-4">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-20 object-cover rounded-md border border-[#EDE5D5]"
                    />
                    <div className="flex-1 space-y-1 text-left">
                      <h4 className="font-serif text-xs font-semibold text-[#4A2925]">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-[#8C7A6B]">Qty: {item.quantity}</p>
                      <p className="text-xs font-bold text-[#4A2925]">
                        ₹ {(item.product.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.product.id)}
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
                  onClick={() => alert("Checkout system is ready for backend integration!")}
                  className="w-full py-3 bg-[#4A2925] text-white text-xs font-semibold tracking-widest uppercase rounded-full hover:bg-[#3D211E] transition-colors"
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-over Wishlist Drawer */}
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

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsLoginOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#FAF7F2] rounded-2xl shadow-2xl p-8 z-10 border border-[#EDE5D5]">
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 p-1 text-[#8C7A6B] hover:text-[#4A2925]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6 space-y-1">
              <h3 className="font-serif text-2xl font-bold text-[#4A2925]">
                Welcome to Khushi's Zone
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                Sign in to your account to manage orders & wishlist
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsLoginOpen(false);
              }}
              className="space-y-4 text-left"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#4A2925] tracking-wider uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 bg-white border border-[#EDE5D5] rounded-lg text-xs focus:ring-1 focus:ring-[#4A2925] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A2925] tracking-wider uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-white border border-[#EDE5D5] rounded-lg text-xs focus:ring-1 focus:ring-[#4A2925] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#4A2925]">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-[#EDE5D5] text-[#4A2925] focus:ring-[#4A2925]"
                  />
                  <span className="ml-2 text-[#8C7A6B]">Remember me</span>
                </label>
                <a href="#" className="hover:underline font-semibold">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#4A2925] text-white rounded-full text-xs font-bold tracking-widest uppercase hover:bg-[#3D211E] transition-colors shadow-sm"
              >
                SIGN IN
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
