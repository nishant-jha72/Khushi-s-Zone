import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Search, Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import { getProductsApi, type Product } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useLayout } from "../../components/layout/useLayout";

interface SearchResultPageProps {
  onSelectProduct?: (productId: string) => void;
}

export default function SearchResultPage({
  onSelectProduct,
}: SearchResultPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const layout = useLayout();
  const { isAuthenticated, wishlist, addToCart, toggleWishlist } = useAuth();

  const query = searchParams.get("search") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setProductsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setProductsLoading(true);
      try {
        const res = await getProductsApi(undefined, query);
        if (res.success && res.products) {
          setProducts(res.products);
          setTotalCount(res.total ?? res.products.length);
        }
      } catch (err) {
        console.error("Failed to fetch search results:", err);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      layout?.openAuth("login");
      return;
    }
    action();
  };

  const handleToggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(async () => {
      try {
        await toggleWishlist(productId);
      } catch (err) {
        console.error("Wishlist toggle error:", err);
        layout?.openAuth("login");
      }
    });
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(async () => {
      try {
        await addToCart(product);
        layout?.openCart();
      } catch (err) {
        console.error("Add to cart error:", err);
        layout?.openAuth("login");
      }
    });
  };

  const handleProductClick = (productId: string) => {
    if (onSelectProduct) {
      onSelectProduct(productId);
    } else {
      navigate(`/product/${productId}`);
    }
  };

  return (
    <div className="min-h-[80dvh] bg-[#F7F2EA] px-4 sm:px-8 lg:px-12 py-8">
      {/* Breadcrumb / Back Link */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#4A2925] hover:text-[#6E493F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Search Header Banner */}
      <div className="max-w-7xl mx-auto bg-[#EDE5D5] rounded-2xl p-6 sm:p-8 mb-8 border border-[#D9CEB9] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A2925] flex items-center space-x-3">
            <Search className="w-6 h-6 text-[#6E493F]" />
            <span>Search Results for "{query}"</span>
          </h1>
          <p className="text-xs text-[#8C7A6B] mt-1 font-medium">
            {loading
              ? "Searching collection..."
              : `Found ${totalCount} matching styles`}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="py-24 text-center text-xs text-[#8C7A6B] font-medium tracking-wider uppercase">
            Loading search results...
          </div>
        ) : products.length === 0 ? (
          <div className="bg-[#FAF7F2] rounded-2xl p-12 text-center border border-[#EDE5D5] max-w-lg mx-auto shadow-sm">
            <Search className="w-12 h-12 text-[#8C7A6B] mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-serif text-lg font-bold text-[#4A2925] mb-2">
              No styles found
            </h3>
            <p className="text-xs text-[#8C7A6B] mb-6">
              We couldn't find anything matching "{query}". Try searching with
              different keywords or browse our categories.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 bg-[#4A2925] text-[#F7F2EA] text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-[#3D211E] transition-colors"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((product) => {
              const isWishlisted = wishlist?.some(
                (item: any) =>
                  item.id === product.id || item.itemId === product.id,
              );

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="group bg-[#FAF7F2] rounded-2xl overflow-hidden border border-[#EDE5D5] hover:border-[#D9CEB9] transition-all duration-300 flex flex-col cursor-pointer shadow-sm hover:shadow-md relative"
                >
                  {/* Badge */}
                  {product.badge && (
                    <span className="absolute top-3 left-3 z-10 bg-[#4A2925] text-[#F7F2EA] text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {product.badge}
                    </span>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleToggleWishlist(product.id, e)}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-[#FAF7F2]/80 backdrop-blur-sm text-[#4A2925] hover:bg-[#FAF7F2] transition-all shadow-sm"
                    aria-label="Wishlist"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isWishlisted
                          ? "fill-[#4A2925] text-[#4A2925]"
                          : "stroke-[1.75]"
                      }`}
                    />
                  </button>

                  {/* Product Image */}
                  <div className="relative w-full overflow-hidden bg-[#EDE5D5]">
                    <img
                      src={product.image || "/images/placeholder.png"}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/images/placeholder.png";
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-[#8C7A6B] font-semibold uppercase tracking-wider mb-1">
                        {product.category}
                      </p>
                      <h3 className="font-serif font-bold text-sm text-[#4A2925] line-clamp-1 group-hover:text-[#6E493F] transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#EDE5D5]">
                      <div className="flex items-baseline space-x-2">
                        <span className="font-serif font-bold text-sm text-[#4A2925]">
                          ₹{product.price}
                        </span>
                        {product.originalPrice &&
                          product.originalPrice > product.price && (
                            <span className="text-[10px] text-[#8C7A6B] line-through">
                              ₹{product.originalPrice}
                            </span>
                          )}
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        className="px-3 py-1.5 bg-[#4A2925] text-[#F7F2EA] text-[10px] font-semibold uppercase tracking-wider rounded-full hover:bg-[#3D211E] transition-colors flex items-center space-x-1"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
