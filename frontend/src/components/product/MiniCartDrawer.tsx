import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";

export interface MiniCartItem {
  id: string;
  name: string;
  image: string;
  size: string;
  price: number;
}

interface MiniCartDrawerProps {
  open: boolean;
  item: MiniCartItem | null;
  onClose: () => void;
  onViewBag?: () => void;
}

export default function MiniCartDrawer({
  open,
  item,
  onClose,
  onViewBag,
}: MiniCartDrawerProps) {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (open) setQty(1);
  }, [open, item?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !item) return null;
  const subtotal = item.price * qty;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Added to your bag"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#FDFBF7] shadow-2xl flex flex-col animate-[slideIn_0.25s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDE5D5]">
          <h3 className="font-serif text-base font-bold text-[#4A2925]">
            Added to Your Bag
          </h3>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 rounded-full hover:bg-[#EDE5D5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925]"
          >
            <X className="w-4 h-4 text-[#4A2925]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex gap-4">
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-24 object-cover rounded-lg border border-[#D9CEB9] bg-[#EDE5D5]"
            />
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm font-bold text-[#4A2925] truncate">
                {item.name}
              </p>
              <p className="text-[11px] text-[#8C7A6B] mt-0.5">
                Size: {item.size || "—"}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center border border-[#D9CEB9] rounded-full">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="p-1.5 px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925] rounded-full"
                  >
                    <Minus className="w-3.5 h-3.5 text-[#4A2925]" />
                  </button>
                  <span className="text-xs font-bold w-6 text-center text-[#4A2925]">
                    {qty}
                  </span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => Math.min(10, q + 1))}
                    className="p-1.5 px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925] rounded-full"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#4A2925]" />
                  </button>
                </div>
                <span className="text-sm font-bold text-[#4A2925]">
                  ₹ {subtotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-[#EDE5D5] space-y-3 bg-[#F7F2EA]">
          <div className="flex justify-between text-sm">
            <span className="text-[#8C7A6B]">Subtotal</span>
            <span className="font-bold text-[#4A2925]">
              ₹ {subtotal.toLocaleString("en-IN")}
            </span>
          </div>
          <button
            onClick={onViewBag}
            className="w-full py-3 rounded-full bg-[#4A2925] text-[#FDFBF7] text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-[#3A211E] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4A2925]"
          >
            View Bag & Checkout
          </button>
          <button
            onClick={onClose}
            className="w-full py-1 text-[11px] font-semibold text-[#8C7A6B] hover:text-[#4A2925] transition"
          >
            Continue shopping
          </button>
        </div>
      </div>
    </div>
  );
}
