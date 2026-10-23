import { useState } from "react";
import {
  Check,
  Heart,
  Loader2,
  MapPin,
  RotateCcw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import type {
  DeliveryCheckResult,
  Product,
  ProductColor,
} from "../../pages/type";
import SizeGuideModal from "./SizeGuideModal";

interface ProductInfoPanelProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onAddToBag: (size: string, qty: number) => Promise<void> | void;
  added: boolean;
  adding: boolean;
  checkDelivery?: (pincode: string) => Promise<DeliveryCheckResult>;
}

// Trust row — edit labels to match your actual business policies.
const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Secure Checkout" },
  { icon: RotateCcw, label: "Easy Returns" },
  { icon: Truck, label: "Free Shipping on orders above ₹999" },
];

export default function ProductInfoPanel({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToBag,
  added,
  adding,
  checkDelivery,
}: ProductInfoPanelProps) {
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes?.[0] ?? "",
  );
  const [sizeError, setSizeError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const [checkingPin, setCheckingPin] = useState(false);
  const [pinResult, setPinResult] = useState<DeliveryCheckResult | null>(null);

  const price = Number(product.price);
  const originalPrice = product.original_price
    ? Number(product.original_price)
    : null;
  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  const stock = product.stock;
  const outOfStock = stock !== undefined && stock <= 0;
  const lowStock = stock !== undefined && stock > 0 && stock <= 5;

  const handleAdd = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setSizeError("Please select a size before adding to bag.");
      return;
    }
    setSizeError("");
    void onAddToBag(selectedSize, 1);
  };

  const handlePinCheck = async () => {
    if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      setPinResult({
        available: false,
        message: "Please enter a valid 6-digit pincode.",
      });
      return;
    }
    if (!checkDelivery) {
      // Integration point — no fake verification.
      setPinResult({
        available: false,
        message:
          "Delivery check will be available soon. You can still place your order.",
      });
      return;
    }
    setCheckingPin(true);
    setPinResult(null);
    try {
      const res = await checkDelivery(pincode.trim());
      setPinResult(res);
    } catch {
      setPinResult({
        available: false,
        message: "Could not check delivery right now. Please try again.",
      });
    } finally {
      setCheckingPin(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Category label */}
      {product.category && (
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#8C7A6B]">
          {product.category.name ?? product.category.slug.replace(/-/g, " ")}
        </span>
      )}

      {/* 2. Title */}
      <h1 className="font-serif text-2xl sm:text-[32px] leading-snug font-bold text-[#4A2925]">
        {product.name}
      </h1>

      {/* 3. Rating — only real data */}
      {product.rating != null && (
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-0.5"
            aria-label={`Rated ${product.rating} out of 5`}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.round(product.rating!)
                    ? "fill-[#4A2925] text-[#4A2925]"
                    : "text-[#D9CEB9]"
                }`}
              />
            ))}
          </span>
          <span className="text-xs font-semibold text-[#4A2925]">
            {Number(product.rating).toFixed(1)}
          </span>
          {product.review_count != null && (
            <span className="text-xs text-[#8C7A6B]">
              ({product.review_count} reviews)
            </span>
          )}
        </div>
      )}

      {/* 4–6. Price block */}
      <div className="border-y border-[#EDE5D5] py-4 space-y-1">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-[26px] font-bold text-[#4A2925]">
            ₹ {price.toLocaleString("en-IN")}
          </span>
          {originalPrice && originalPrice > price && (
            <>
              <span className="text-sm text-[#8C7A6B] line-through">
                ₹ {originalPrice.toLocaleString("en-IN")}
              </span>
              {discountPercent && (
                <span className="text-[11px] font-bold text-[#4A2925] bg-[#EDE5D5] px-2 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
              )}
            </>
          )}
        </div>
        <p className="text-[11px] text-[#8C7A6B]">Inclusive of all taxes</p>
      </div>

      {/* 7. Description */}
      {product.description && (
        <p className="text-[13px] text-[#6E574C] leading-relaxed">
          {product.description}
        </p>
      )}

      {/* Colors (if variants exist) */}
      {product.colors && product.colors.length > 0 && (
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[#4A2925] mb-2">
            Colour
          </span>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((c: ProductColor, i: number) => (
              <span
                key={c.color_name + i}
                title={c.color_name}
                className="w-8 h-8 rounded-full border border-black/10"
                style={{ backgroundColor: c.hex_code || "#D9CEB9" }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 8–9. Size selector + guide */}
      {product.sizes && product.sizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A2925]">
              Select Size
            </span>
            <button
              onClick={() => setGuideOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C7A6B] hover:text-[#4A2925] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925] rounded"
            >
              <Ruler className="w-3.5 h-3.5" />
              Size Guide
            </button>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Select size"
          >
            {product.sizes.map((sz: string) => (
              <button
                key={sz}
                role="radio"
                aria-checked={selectedSize === sz}
                disabled={outOfStock}
                onClick={() => {
                  setSelectedSize(sz);
                  setSizeError("");
                }}
                className={`min-w-[44px] px-4 py-2.5 rounded-lg text-xs font-bold border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925] disabled:opacity-40 disabled:cursor-not-allowed ${
                  selectedSize === sz
                    ? "bg-[#4A2925] text-[#FDFBF7] border-[#4A2925]"
                    : "bg-white text-[#4A2925] border-[#D9CEB9] hover:border-[#4A2925]"
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
          {sizeError && (
            <p
              role="alert"
              className="text-[11px] font-semibold text-red-700 mt-2"
            >
              {sizeError}
            </p>
          )}
        </div>
      )}

      {/* 10–11. Stock / dispatch — only real data */}
      {outOfStock ? (
        <p className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          Currently out of stock
        </p>
      ) : (
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${lowStock ? "bg-amber-500" : "bg-emerald-600"}`}
          />
          <span className="font-semibold text-[#4A2925]">
            {lowStock ? `Low stock — only ${stock} left` : "In stock"}
          </span>
          {product.dispatch_days != null && (
            <span className="text-[#8C7A6B]">
              | Usually ships in {product.dispatch_days} day
              {product.dispatch_days > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* 12–13. CTA row */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={handleAdd}
          disabled={adding || added || outOfStock}
          className={`flex-1 py-3.5 px-6 rounded-full text-[11px] font-bold tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4A2925] disabled:cursor-not-allowed ${
            added
              ? "bg-emerald-800 text-white"
              : outOfStock
                ? "bg-[#D9CEB9] text-[#8C7A6B] shadow-none"
                : "bg-[#4A2925] hover:bg-[#3A211E] text-[#FDFBF7]"
          }`}
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : added ? (
            <Check className="w-4 h-4" />
          ) : (
            <ShoppingBag className="w-4 h-4" />
          )}
          {outOfStock
            ? "Out of Stock"
            : adding
              ? "Adding..."
              : added
                ? "Added to Bag"
                : "Add to Bag"}
        </button>

        <button
          onClick={onToggleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          className="p-3.5 rounded-full border border-[#D9CEB9] bg-white text-[#4A2925] hover:border-[#4A2925] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925]"
        >
          <Heart
            className={`w-5 h-5 ${isWishlisted ? "fill-[#4A2925]" : ""}`}
          />
        </button>
      </div>

      {/* 14. Trust row */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 p-3 bg-[#EDE5D5]/60 rounded-xl text-center"
          >
            <Icon className="w-4 h-4 text-[#4A2925]" />
            <span className="text-[10px] font-semibold leading-tight text-[#6E574C]">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* 15. PIN code checker */}
      <div className="pt-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#4A2925] mb-2">
          <MapPin className="w-3.5 h-3.5" />
          Check Delivery
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, ""));
              setPinResult(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handlePinCheck()}
            placeholder="Enter your pincode"
            aria-label="Delivery pincode"
            className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border border-[#D9CEB9] bg-white text-xs text-[#4A2925] placeholder:text-[#B4A48F] focus:outline-none focus:ring-2 focus:ring-[#4A2925]"
          />
          <button
            onClick={handlePinCheck}
            disabled={checkingPin}
            className="px-5 py-2.5 rounded-lg bg-[#4A2925] text-[#FDFBF7] text-xs font-bold hover:bg-[#3A211E] transition disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4A2925]"
          >
            {checkingPin ? "Checking..." : "Check"}
          </button>
        </div>
        {pinResult && (
          <p
            role="status"
            className={`text-[11px] mt-2 font-medium ${
              pinResult.available ? "text-emerald-700" : "text-[#8C7A6B]"
            }`}
          >
            {pinResult.available
              ? pinResult.eta
                ? `Delivering to ${pincode} — estimated ${pinResult.eta}`
                : `Delivering to ${pincode}`
              : pinResult.message}
          </p>
        )}
      </div>

      <SizeGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
