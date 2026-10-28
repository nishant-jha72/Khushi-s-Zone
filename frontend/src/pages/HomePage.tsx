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
  const {
    isAuthenticated,
    wishlist,
    addToCart,
    toggleWishlist,
  } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Active search query from layout header or URL param
  const activeSearchQuery = layout?.searchQuery ?? searchParams.get("search") ?? "";

  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch && layout?.setSearchQuery && layout.searchQuery !== urlSearch) {
      layout.setSearchQuery(urlSearch);
    }
  }, [searchParams, layout]);

  useEffect(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await getProductsApi(
          selectedCategory || undefined,
          activeSearchQuery || undefined,
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
  }, [selectedCategory, activeSearchQuery]);

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
      const matchesSearch =
        activeSearchQuery === "" ||
        product.name.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(activeSearchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, activeSearchQuery, selectedCategory]);

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
    layout?.setSearchQuery("");
    if (searchParams.has("search")) {
      searchParams.delete("search");
      setSearchParams(searchParams);
    }
  };

  return (
    <div>
      {(selectedCategory || activeSearchQuery) && (
        <div className="bg-[#EDE5D5] py-3 px-6 text-center text-xs font-semibold tracking-wider text-[#4A2925] flex items-center justify-center space-x-3 border-b border-[#D9CEB9]">
          <span>
            FILTERING BY:{" "}
            {selectedCategory ? selectedCategory.toUpperCase() : ""}{" "}
            {activeSearchQuery ? `"${activeSearchQuery}"` : ""}
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
