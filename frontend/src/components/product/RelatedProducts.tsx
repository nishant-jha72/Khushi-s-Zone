import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import type { RelatedProduct } from "../../pages/type";

interface RelatedProductsProps {
  products: RelatedProduct[];
  onOpenProduct: (id: number | string) => void;
  onToggleWishlist?: (id: string) => void;
  wishlist?: string[];
}

export default function RelatedProducts({
  products,
  onOpenProduct,
  onToggleWishlist,
  wishlist = [],
}: RelatedProductsProps) {
  const [start, setStart] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  // Reset scroll position when the product set changes
  useEffect(() => setStart(0), [products]);

  if (products.length === 0) return null;

  const visible = 4;
  const maxStart = Math.max(0, products.length - visible);
  const clampedStart = Math.min(start, maxStart);
  const page = products.slice(clampedStart, clampedStart + visible);

  return (
    <section aria-labelledby="related-heading">
      <div className="flex items-center justify-between mb-5">
        <h2
          id="related-heading"
          className="font-serif text-xl sm:text-2xl font-bold text-[#4A2925]"
        >
          You May Also Like
        </h2>
        {products.length > visible && (
          <div className="flex gap-2">
            <button
              onClick={() => setStart((s) => Math.max(0, s - 1))}
              disabled={clampedStart === 0}
              aria-label="Previous products"
              className="p-2 rounded-full border border-[#D9CEB9] text-[#4A2925] hover:border-[#4A2925] disabled:opacity-40 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setStart((s) => Math.min(maxStart, s + 1))}
              disabled={clampedStart >= maxStart}
              aria-label="Next products"
              className="p-2 rounded-full border border-[#D9CEB9] text-[#4A2925] hover:border-[#4A2925] disabled:opacity-40 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {page.map((p) => {
          const id = p.id.toString();
          const img = failed[id]
            ? "/images/placeholder.png"
            : p.image_url || p.image || "/images/placeholder.png";
          const price = Number(p.price);
          const orig = p.original_price ? Number(p.original_price) : null;
          const discount =
            orig && orig > price
              ? Math.round(((orig - price) / orig) * 100)
              : null;

          return (
            <article key={id} className="group">
              <button
                onClick={() => onOpenProduct(p.id)}
                aria-label={`View ${p.name}`}
                className="block w-full relative rounded-xl overflow-hidden bg-[#EDE5D5] border border-[#D9CEB9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925]"
              >
                <img
                  src={img}
                  alt={p.name}
                  loading="lazy"
                  onError={() => setFailed((f) => ({ ...f, [id]: true }))}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {discount && (
                  <span className="absolute top-3 left-3 bg-[#4A2925] text-[#FDFBF7] text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm">
                    {discount}% Off
                  </span>
                )}
                {onToggleWishlist && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={
                      wishlist.includes(id)
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleWishlist(id);
                      }
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/85 hover:bg-white shadow-md transition"
                  >
                    <Heart
                      className={`w-4 h-4 text-[#4A2925] ${
                        wishlist.includes(id) ? "fill-[#4A2925]" : ""
                      }`}
                    />
                  </span>
                )}
              </button>
              <div className="pt-3 space-y-1">
                <h3 className="font-serif text-sm font-bold text-[#4A2925] truncate">
                  {p.name}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-[#4A2925]">
                    ₹ {price.toLocaleString("en-IN")}
                  </span>
                  {orig && orig > price && (
                    <span className="text-[#8C7A6B] line-through">
                      ₹ {orig.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                {p.rating != null && (
                  <div className="flex items-center gap-1 text-[10px] text-[#8C7A6B]">
                    <Star className="w-3 h-3 fill-[#4A2925] text-[#4A2925]" />
                    <span className="font-semibold text-[#4A2925]">
                      {Number(p.rating).toFixed(1)}
                    </span>
                    {p.review_count != null && <span>({p.review_count})</span>}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
