import { useEffect } from "react";
import { X } from "lucide-react";

// ------------------------------------------------------------------
// CONFIGURABLE GUIDE: replace these rows with your brand's real
// measurement chart when available. Clearly labeled, not fabricated.
// ------------------------------------------------------------------
const SIZE_GUIDE_ROWS: { size: string; bust: string; waist: string; hip: string }[] = [
  { size: "XS", bust: "32 in", waist: "26 in", hip: "34 in" },
  { size: "S",  bust: "34 in", waist: "28 in", hip: "36 in" },
  { size: "M",  bust: "36 in", waist: "30 in", hip: "38 in" },
  { size: "L",  bust: "38 in", waist: "32 in", hip: "40 in" },
  { size: "XL", bust: "40 in", waist: "34 in", hip: "42 in" },
];

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SizeGuideModal({ open, onClose }: SizeGuideModalProps) {
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

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FDFBF7] rounded-2xl border border-[#D9CEB9] shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#EDE5D5]">
          <h3 className="font-serif text-lg font-bold text-[#4A2925]">
            Size Guide
          </h3>
          <button
            onClick={onClose}
            aria-label="Close size guide"
            className="p-2 rounded-full hover:bg-[#EDE5D5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2925]"
          >
            <X className="w-4 h-4 text-[#4A2925]" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-[11px] text-[#8C7A6B] mb-4 leading-relaxed">
            All measurements are body measurements in inches. This is a general
            guide — fit may vary slightly by style.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[#8C7A6B] uppercase tracking-wider border-b border-[#D9CEB9]">
                <th className="py-2 font-semibold">Size</th>
                <th className="py-2 font-semibold">Bust</th>
                <th className="py-2 font-semibold">Waist</th>
                <th className="py-2 font-semibold">Hip</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_GUIDE_ROWS.map((row) => (
                <tr
                  key={row.size}
                  className="border-b border-[#EDE5D5] text-[#4A2925]"
                >
                  <td className="py-2.5 font-bold">{row.size}</td>
                  <td className="py-2.5">{row.bust}</td>
                  <td className="py-2.5">{row.waist}</td>
                  <td className="py-2.5">{row.hip}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-[#8C7A6B] mt-4">
            Model wears size S. For sizing help, contact us before ordering.
          </p>
        </div>
      </div>
    </div>
  );
}
