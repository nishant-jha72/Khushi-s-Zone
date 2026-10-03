import { Sparkles, ShieldCheck, Truck } from "lucide-react";

export default function TrustBar() {
  return (
    <section className="w-full bg-[#F7F2EA] border-y border-[#EDE5D5] py-5 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#EDE5D5] items-center text-center">
        {/* Item 1 */}
        <div className="flex items-center justify-center space-x-3 py-2 sm:py-0 px-4">
          <Sparkles className="w-4 h-4 text-[#4A2925] stroke-[1.5]" />
          <span className="text-xs font-medium text-[#4A2925] tracking-wide">
            Thoughtfully curated
          </span>
        </div>

        {/* Item 2 */}
        <div className="flex items-center justify-center space-x-3 py-2 sm:py-0 px-4">
          <ShieldCheck className="w-4 h-4 text-[#4A2925] stroke-[1.5]" />
          <span className="text-xs font-medium text-[#4A2925] tracking-wide">
            Secure checkout
          </span>
        </div>

        {/* Item 3 */}
        <div className="flex items-center justify-center space-x-3 py-2 sm:py-0 px-4">
          <Truck className="w-4 h-4 text-[#4A2925] stroke-[1.5]" />
          <span className="text-xs font-medium text-[#4A2925] tracking-wide">
            Delivery you can track
          </span>
        </div>
      </div>
    </section>
  );
}
