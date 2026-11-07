import { useState, useEffect, useMemo } from "react";
import {
  Link,
  useParams,
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import ProductCard from "../components/products/ProductCard";
import { useAuth } from "../context/AuthContext";
import { getProductsApi, type Product } from "../services/api";
import type { LayoutContextType } from "../components/layout/useLayout";

import { SlidersHorizontal, ArrowLeft, Search, X } from "lucide-react";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const currentSlug = slug || "dresses";

  // Access shared Layout functionality
  const { openCart, openAuth, searchQuery, setSearchQuery } =
    useOutletContext<LayoutContextType>();

  // Authentication and shopping data
  const { isAuthenticated, wishlist, addToCart, toggleWishlist } = useAuth();

  // Component state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState(searchQuery || "");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(10000);

  // Keep Header search and Category search synchronized
  useEffect(() => {
    setSearch(searchQuery || "");
  }, [searchQuery]);

  useEffect(() => {
    setSearchQuery(search);
  }, [search, setSearchQuery]);

  // Authentication helper
  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      openAuth("login");
      return;
    }

    action();
  };

  // Toggle product wishlist
  const handleToggleWishlist = (productId: string | number) => {
    requireAuth(async () => {
      try {
        await toggleWishlist(productId);
      } catch (err) {
        console.error("Wishlist error:", err);
      }
    });
  };

  // Add product to cart and open cart drawer
  const handleAddToCart = (product: Product) => {
    requireAuth(async () => {
      try {
        await addToCart(product);
        openCart();
      } catch (err) {
        console.error("Add to cart error:", err);
      }
    });
  };

  // Fetch category products
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);

      try {
        const res = await getProductsApi(
          currentSlug || undefined,
          search || undefined,
        );

        if (res.success && res.products) {
          setProducts(res.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Failed to load category products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [currentSlug, search]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by maximum price
    result = result.filter((product) => product.price <= maxPrice);

    // Filter by selected size
    if (selectedSize) {
      result = result.filter(
        (product) => product.sizes && product.sizes.includes(selectedSize),
      );
    }

    // Sorting
    if (sortBy === "low_high") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "high_low") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      result.sort((a, b) => (b.id > a.id ? 1 : -1));
    }

    return result;
  }, [products, maxPrice, selectedSize, sortBy]);

  // Format category title
  const categoryTitle =
    currentSlug.charAt(0).toUpperCase() +
    currentSlug.slice(1).replace("-", " ");

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#4A2925] font-sans antialiased flex flex-col">
      {/* Category Hero Banner */}
      <div className="bg-[#EDE5D5] py-5 px-4 sm:px-8 border-b border-[#D9CEB9]">
        <div className="max-w-7xl mx-auto space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8C7A6B] hover:text-[#4A2925] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-[#8C7A6B]">
                COLLECTION
              </span>

              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#4A2925] tracking-tight mt-0.5">
                {categoryTitle}
              </h1>
            </div>

            <p className="text-[11px] font-semibold text-[#6E493F]">
              Showing {filteredAndSortedProducts.length} items from inventory
            </p>
          </div>
        </div>
      </div>

      {/* Main Filter and Products Layout */}
      <div className="max-w-7xl w-full mx-auto px-6 sm:px-12 py-10">
        {/* Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#EDE5D5] shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Search */}
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
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-xs text-[#8C7A6B] hover:text-[#4A2925] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Size Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto py-1">
            <span className="text-xs font-semibold text-[#8C7A6B] mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Size:
            </span>

            {["XS", "S", "M", "L", "XL", "XXL"].map((sz) => (
              <button
                key={sz}
                onClick={() => setSelectedSize(selectedSize === sz ? null : sz)}
                className={`px-3 py-1 rounded-md text-xs font-semibold border transition cursor-pointer ${
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
            <span className="text-xs font-semibold text-[#8C7A6B]">
              Sort by:
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
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

            <p className="text-xs text-[#8C7A6B] font-medium">
              Fetching catalog for {categoryTitle}...
            </p>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 border border-[#EDE5D5] text-center max-w-md mx-auto space-y-4 shadow-xs">
            <div className="text-4xl">🛍️</div>

            <h3 className="font-serif text-lg font-bold text-[#4A2925]">
              No products found
            </h3>

            <p className="text-xs text-[#8C7A6B]">
              We couldn't find any products matching your selected filters in{" "}
              {categoryTitle}.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setSelectedSize(null);
                setMaxPrice(10000);
                setSortBy("featured");
              }}
              className="px-5 py-2 bg-[#4A2925] text-white text-xs font-semibold rounded-full uppercase hover:bg-[#3D211E] transition-colors cursor-pointer"
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
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
                onSelectProduct={(productId) =>
                  navigate(`/product/${productId}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
