import { useState } from "react";
import { Heart, ShoppingBag, Check } from "lucide-react";
import type { Product } from "../../services/api";

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({
  product,
  isWishlisted = false,
  onToggleWishlist,
  onAddToCart,
}: ProductCardProps) {
  const [added, setAdded] = useState(false);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  return (
    <div className="group bg-white rounded-lg overflow-hidden border border-[#EDE5D5]/80 hover:border-[#4A2925]/30 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F7F2EA] cursor-pointer">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-500 ease-out"
        />

        {/* Badge if present */}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-[#4A2925] text-white text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-sm shadow-xs">
            {product.badge}
          </span>
        )}

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistClick}
          aria-label="Add to wishlist"
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs text-[#4A2925] shadow-xs transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? "fill-[#4A2925] text-[#4A2925]" : "text-[#4A2925]"
            }`}
          />
        </button>

        {/* Quick Add To Bag overlay button on hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleAddClick}
            className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold tracking-wider uppercase flex items-center justify-center space-x-2 transition-all duration-200 shadow-md ${
              added
                ? "bg-emerald-800 text-white"
                : "bg-[#4A2925] hover:bg-[#3D211E] text-white"
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>ADDED TO BAG</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>ADD TO BAG</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 space-y-2 text-left bg-white">
        <h3 className="font-serif text-sm font-medium text-[#4A2925] group-hover:text-[#6E493F] transition-colors line-clamp-1">
          {product.name}
        </h3>

        <div className="flex items-baseline space-x-2">
          <span className="text-xs font-bold text-[#4A2925]">
            ₹ {product.price.toLocaleString("en-IN")}
          </span>
          {product.originalPrice && (
            <span className="text-[11px] text-[#8C7A6B] line-through font-normal">
              ₹ {product.originalPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
