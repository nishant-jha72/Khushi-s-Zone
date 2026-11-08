import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "../products/ProductCard";
import { getLatestProductsApi, type Product } from "../../services/api";

interface FeaturedProductsProps {
  products?: Product[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct?: (productId: string) => void;
}

export default function FeaturedProducts({
  products: initialProducts,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
}: FeaturedProductsProps) {
  const [latestProducts, setLatestProducts] = useState<Product[]>(
    initialProducts || [],
  );
  const [loading, setLoading] = useState(!initialProducts?.length);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setLatestProducts(initialProducts);
      setLoading(false);
      return;
    }

    const fetchLatest = async () => {
      setLoading(true);
      try {
        const res = await getLatestProductsApi(10);
        if (res.success && res.products) {
          setLatestProducts(res.products);
        }
      } catch (err) {
        console.error("Failed to fetch latest products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
  }, [initialProducts]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="w-full bg-[#F7F2EA] py-16 px-6 sm:px-10 lg:px-16 border-t border-[#EDE5D5]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Heading & Slider Controls */}
        <div className="flex items-end justify-between">
          <div className="space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl text-[#4A2925] tracking-tight">
              Newly arrived on Khushi's Zone
            </h2>
            <div className="w-16 h-0.5 bg-[#8C7A6B]/40" />
          </div>

          {/* Left / Right Slider Navigation Buttons */}
          {!loading && latestProducts.length > 4 && (
            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={() => handleScroll("left")}
                aria-label="Scroll left"
                className="p-2.5 rounded-full bg-[#EDE5D5] text-[#4A2925] hover:bg-[#D9CEB9] transition-colors cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleScroll("right")}
                aria-label="Scroll right"
                className="p-2.5 rounded-full bg-[#EDE5D5] text-[#4A2925] hover:bg-[#D9CEB9] transition-colors cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Product Carousel Container */}
        {loading ? (
          <div className="text-center py-12 text-[#8C7A6B]">
            <p className="text-sm">Loading new arrivals...</p>
          </div>
        ) : latestProducts.length === 0 ? (
          <div className="text-center py-12 text-[#8C7A6B]">
            <p className="text-sm">
              No styles match your filter. Try searching for something else!
            </p>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex gap-5 overflow-x-auto scrollbar-none pb-4 pt-1 snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {latestProducts.map((product) => (
              <div
                key={product.id}
                className="w-[210px] sm:w-[240px] lg:w-[260px] flex-shrink-0 snap-start"
              >
                {/* Wrapped inside a fixed-size container wrapper to enforce curated thumbnail dimensions */}
                <div className="[&_img]:aspect-[3/4] [&_img]:object-cover [&_img]:w-full">
                  <ProductCard
                    product={product}
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={onToggleWishlist}
                    onAddToCart={onAddToCart}
                    onSelectProduct={onSelectProduct}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
