import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, X, ZoomIn } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  badge?: string; // e.g. "BESTSELLER"
}

export default function ProductImageGallery({
  images,
  productName,
  isWishlisted,
  onToggleWishlist,
  badge,
}: ProductImageGalleryProps) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  // Reset when the product changes so we never show a stale image
  useEffect(() => {
    setIndex(0);
    setFailed({});
  }, [images]);

  const safeImages = images.filter(Boolean);
  const current = safeImages[Math.min(index, safeImages.length - 1)] ?? "";
  const hasMultiple = safeImages.length > 1;

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + safeImages.length) % safeImages.length);
    },
    [safeImages.length],
  );

  // Keyboard navigation for the lightbox
  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen, go]);

  const srcFor = (url: string, idx: number) =>
    failed[idx] ? "/images/placeholder.png" : url;

  if (safeImages.length === 0) {
    return (
      <div className="aspect-[3/4] rounded-2xl bg-[#EDE5D5] border border-[#D9CEB9] flex items-center justify-center text-xs text-[#8C7A6B]">
        No image available
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4">
      {/* Thumbnail strip */}
      {hasMultiple && (
        <div
          className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:max-h-[560px] sm:w-[76px] flex-shrink-0 pr-1"
          role="tablist"
          aria-label="Product images"
        >
          {safeImages.map((url, i) => (
            <button
              key={url + i}
              role="tab"
              aria-selected={index === i}
              aria-label={`View image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925] ${
                index === i
                  ? "border-[#4A2925] shadow-sm"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={srcFor(url, i)}
                alt={`${productName} - view ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main stage */}
      <div className="flex-1 relative aspect-[3/4] bg-[#FDFBF7] rounded-2xl overflow-hidden border border-[#D9CEB9] shadow-sm group">
        <img
          src={srcFor(current, index)}
          alt={productName}
          onError={() => setFailed((f) => ({ ...f, [index]: true }))}
          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        {badge && (
          <span className="absolute top-4 left-4 bg-[#4A2925] text-[#FDFBF7] text-[10px] font-semibold tracking-[0.18em] uppercase px-3 py-1.5 rounded-sm">
            {badge}
          </span>
        )}

        {/* Wishlist overlay */}
        <button
          onClick={onToggleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          className="absolute top-4 right-4 p-3 rounded-full bg-white/85 hover:bg-white backdrop-blur-sm text-[#4A2925] shadow-md transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925]"
        >
          <Heart
            className={`w-5 h-5 ${isWishlisted ? "fill-[#4A2925]" : ""}`}
          />
        </button>

        {/* Zoom */}
        <button
          onClick={() => setZoomOpen(true)}
          aria-label="Open full-screen image viewer"
          className="absolute bottom-4 right-4 p-2.5 rounded-full bg-white/85 hover:bg-white backdrop-blur-sm text-[#4A2925] shadow-md opacity-0 group-hover:opacity-100 transition focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925]"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Prev / Next */}
        {hasMultiple && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/85 hover:bg-white shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/85 hover:bg-white shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Full-screen lightbox */}
      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} enlarged view`}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <button
            aria-label="Close viewer"
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white"
            onClick={() => setZoomOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          {hasMultiple && (
            <>
              <button
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img
            src={srcFor(current, index)}
            alt={productName}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
