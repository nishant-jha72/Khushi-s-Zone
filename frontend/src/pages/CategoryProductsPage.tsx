import { useState, useEffect, useMemo } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ProductCard from "../components/products/ProductCard";
import { useAuth } from "../context/AuthContext";
import { getProductsApi, type Product } from "../services/api";
import { SlidersHorizontal, ArrowLeft, Search, X } from "lucide-react";

interface CategoryProductsPageProps {
  categorySlug: string;
  onBackToHome: () => void;
  onSelectProduct: (productId: string) => void;
  onOpenAccount: (tab?: string) => void;
  onOpenAdmin?: () => void;
}

export default function CategoryProductsPage({
  categorySlug,
  onBackToHome,
  onSelectProduct,
  onOpenAccount,
  onOpenAdmin,
}: CategoryProductsPageProps) {
  const {
    wishlist,
    addToCart,
    toggleWishlist,
    totalCartCount,
  } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "low_high" | "high_low" | "newest">("featured");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        const res = await getProductsApi(categorySlug || undefined, search || undefined);
        if (res.success && res.products) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error("Failed to load category products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [categorySlug, search]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by max price
    result = result.filter((p) => p.price <= maxPrice);

    // Filter by size if selected
    if (selectedSize) {
      result = result.filter((p) => p.sizes && p.sizes.includes(selectedSize));
    }

    // Sort
    if (sortBy === "low_high") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "high_low") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      result.sort((a, b) => (b.id > a.id ? 1 : -1));
    }

    return result;
  }, [products, maxPrice, selectedSize, sortBy]);

  const categoryTitle =
    categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace("-", " ");

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#4A2925] font-sans antialiased flex flex-col">
      <Header
        wishlistCount={wishlist.length}
        cartCount={totalCartCount}
        searchQuery={search}
        setSearchQuery={setSearch}
        onOpenCart={() => {}}
        onOpenWishlist={() => {}}
        onOpenLogin={() => {}}
        onOpenAccount={onOpenAccount}
        onOpenAdmin={onOpenAdmin}
        onSelectCategory={() => {}}
      />

      {/* Hero Banner for Category */}
      <div className="bg-[#EDE5D5] py-12 px-6 sm:px-12 border-b border-[#D9CEB9]">
        <div className="max-w-7xl mx-auto space-y-3">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-[#8C7A6B] hover:text-[#4A2925] transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Storefront</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#8C7A6B]">
                COLLECTION
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#4A2925] tracking-tight mt-1">
                {categoryTitle}
              </h1>
            </div>

            <p className="text-xs font-semibold text-[#6E493F]">
              Showing {filteredAndSortedProducts.length} items from database
            </p>
          </div>
        </div>
      </div>

      {/* Main Filter & Products Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-12 py-10">
        {/* Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#EDE5D5] shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input inside Category */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#8C7A6B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search in ${categoryTitle}...`}
              className="w-full pl-9 pr-8 py-2 bg-[#F7F2EA] text-xs font-medium text-[#4A2925] placeholder-[#8C7A6B] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4A2925]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-xs text-[#8C7A6B] hover:text-[#4A2925]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Size Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto py-1">
            <span className="text-xs font-semibold text-[#8C7A6B] mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Size:
            </span>
            {["XS", "S", "M", "L", "XL", "XXL"].map((sz) => (
              <button
                key={sz}
                onClick={() => setSelectedSize(selectedSize === sz ? null : sz)}
                className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
                  selectedSize === sz
                    ? "bg-[#4A2925] text-white border-[#4A2925]"
                    : "bg-[#F7F2EA] text-[#4A2925] border-[#EDE5D5] hover:border-[#4A2925]"
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <span className="text-xs font-semibold text-[#8C7A6B]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#F7F2EA] border border-[#EDE5D5] text-xs font-semibold text-[#4A2925] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#4A2925]"
            >
              <option value="featured">Featured</option>
              <option value="low_high">Price: Low to High</option>
              <option value="high_low">Price: High to Low</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#4A2925] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#8C7A6B] font-medium">Fetching catalog from database...</p>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 border border-[#EDE5D5] text-center max-w-md mx-auto space-y-4 shadow-xs">
            <div className="text-4xl">🛍️</div>
            <h3 className="font-serif text-lg font-bold text-[#4A2925]">No products found</h3>
            <p className="text-xs text-[#8C7A6B]">
              We couldn't find any products matching your selected filters in {categoryTitle}.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedSize(null);
                setMaxPrice(10000);
              }}
              className="px-5 py-2 bg-[#4A2925] text-white text-xs font-semibold rounded-full uppercase hover:bg-[#3D211E] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                isWishlisted={wishlist.includes(prod.id)}
                onToggleWishlist={toggleWishlist}
                onAddToCart={addToCart}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
