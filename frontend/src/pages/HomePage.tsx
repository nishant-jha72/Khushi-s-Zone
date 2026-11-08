import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import HeroSection from "../components/home/HeroSection";
import TrustBar from "../components/home/TrustBar";
import CategoryGrid from "../components/home/CategoryGrid";
import FeaturedProducts from "../components/home/FeaturedProducts";
import BrandStory from "../components/home/BrandStory";
import { useAuth } from "../context/AuthContext";
import { getProductsApi, type Product } from "../services/api";
import { useLayout } from "../components/layout/useLayout";

interface HomePageProps {
  onOpenAccount?: (tab?: string) => void;
  onOpenAdmin?: () => void;
  onSelectCategory?: (categorySlug: string) => void;
  onSelectProduct?: (productId: string) => void;
}

export default function HomePage({
  onSelectCategory,
  onSelectProduct,
}: HomePageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const layout = useLayout();
  const { isAuthenticated, wishlist, addToCart, toggleWishlist } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get initial search query from URL or layout
  const urlSearchQuery = searchParams.get("search") || "";
  const layoutSearchQuery = layout?.searchQuery ?? "";

  // Local typing state to prevent the input from clearing while typing
  const [searchInputValue, setSearchInputValue] = useState(
    layoutSearchQuery || urlSearchQuery,
  );

  // Debounced query used for triggering the API request
  const [debouncedSearchQuery, setDebouncedSearchQuery] =
    useState(searchInputValue);

  // Keep local input in sync if layout search changes externally
  useEffect(() => {
    if (
      layout?.searchQuery !== undefined &&
      layout.searchQuery !== searchInputValue
    ) {
      setSearchInputValue(layout.searchQuery);
    }
  }, [layout?.searchQuery]);

  // Debounce input changes to update URL and trigger search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchInputValue);

      // Update layout search query if available
      if (layout?.setSearchQuery && layout.searchQuery !== searchInputValue) {
        layout.setSearchQuery(searchInputValue);
      }

      // Update URL search params cleanly
      const newParams = new URLSearchParams(searchParams);
      if (searchInputValue.trim()) {
        newParams.set("search", searchInputValue.trim());
      } else {
        newParams.delete("search");
      }
      setSearchParams(newParams, { replace: true });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInputValue]);

  // Load products when category or debounced search query changes
  useEffect(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await getProductsApi(
          selectedCategory || undefined,
          debouncedSearchQuery || undefined,
        );
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
  }, [selectedCategory, debouncedSearchQuery]);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      layout?.openAuth("login");
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
        layout?.openAuth("login");
      }
    });
  };

  const handleAddToCart = (product: Product) => {
    requireAuth(async () => {
      try {
        await addToCart(product);
        layout?.openCart();
      } catch (err: any) {
        console.error(err);
        layout?.openAuth("login");
      }
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;
      return matchesCategory;
    });
  }, [products, selectedCategory]);

  const handleCategorySelection = (slug: string) => {
    if (onSelectCategory) {
      onSelectCategory(slug);
    } else {
      navigate(`/category/${slug}`);
    }
  };

  const handleProductSelection = (productId: string) => {
    if (onSelectProduct) {
      onSelectProduct(productId);
    } else {
      navigate(`/product/${productId}`);
    }
  };

  const clearFilter = () => {
    setSelectedCategory(null);
    setSearchInputValue("");
    layout?.setSearchQuery("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("search");
    setSearchParams(newParams);
  };

  return (
    <div>
      {(selectedCategory || debouncedSearchQuery) && (
        <div className="bg-[#EDE5D5] py-3 px-6 text-center text-xs font-semibold tracking-wider text-[#4A2925] flex items-center justify-center space-x-3 border-b border-[#D9CEB9]">
          <span>
            FILTERING BY:{" "}
            {selectedCategory ? selectedCategory.toUpperCase() : ""}{" "}
            {debouncedSearchQuery ? `"${debouncedSearchQuery}"` : ""}
          </span>
          <button
            onClick={clearFilter}
            className="px-2.5 py-0.5 bg-[#4A2925] text-white text-[10px] rounded-full uppercase hover:bg-[#3D211E] transition-colors cursor-pointer"
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

      <CategoryGrid onSelectCategory={handleCategorySelection} />

      <div id="featured-products">
        {productsLoading ? (
          <div className="py-20 text-center text-xs text-[#8C7A6B]">
            Loading collection...
          </div>
        ) : (
          <FeaturedProducts
            products={filteredProducts}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onSelectProduct={handleProductSelection}
          />
        )}
      </div>

      <BrandStory />
    </div>
  );
}
