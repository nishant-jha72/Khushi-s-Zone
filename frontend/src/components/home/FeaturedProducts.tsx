import ProductCard from "../products/ProductCard";
import type { Product } from "../../services/api";

interface FeaturedProductsProps {
  products: Product[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
}

export default function FeaturedProducts({
  products,
  wishlist,
  onToggleWishlist,
  onAddToCart,
}: FeaturedProductsProps) {
  return (
    <section className="w-full bg-[#F7F2EA] py-16 px-6 sm:px-10 lg:px-16 border-t border-[#EDE5D5]">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Heading */}
        <div className="text-center space-y-3">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#4A2925] tracking-tight">
            Loved pieces
          </h2>
          <div className="w-16 h-0.5 bg-[#8C7A6B]/40 mx-auto" />
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12 text-[#8C7A6B]">
            <p className="text-sm">No styles match your filter. Try searching for something else!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
