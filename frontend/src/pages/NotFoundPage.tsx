import { Link } from "react-router-dom";
import { ArrowLeft, Compass, ShoppingBag, HelpCircle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="w-full py-20 px-6 sm:px-12 flex items-center justify-center">
      <div className="max-w-xl w-full text-center space-y-8 bg-[#FAF7F2] p-10 sm:p-14 rounded-3xl border border-[#EDE5D5] shadow-sm">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-[#EDE5D5] text-[#4A2925] text-[10px] font-bold tracking-widest uppercase">
            <Compass className="w-3.5 h-3.5 text-[#6E493F]" />
            <span>404 · Page Not Found</span>
          </div>

          <h1 className="font-serif text-7xl sm:text-9xl font-bold text-[#4A2925] tracking-tight">
            404
          </h1>

          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#4A2925]">
            Looks Like You've Wandered Off
          </h2>

          <p className="text-xs text-[#8C7A6B] max-w-md mx-auto leading-relaxed">
            The page or collection you are looking for might have been moved,
            renamed, or is temporarily unavailable. Let's get you back to our
            curated pieces.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-[#4A2925] hover:bg-[#3D211E] text-white text-xs font-bold tracking-widest uppercase rounded-full transition shadow-sm flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </Link>

          <Link
            to="/category/dresses"
            className="w-full sm:w-auto px-6 py-3 border border-[#4A2925] text-[#4A2925] hover:bg-[#4A2925] hover:text-[#F7F2EA] text-xs font-bold tracking-widest uppercase rounded-full transition flex items-center justify-center space-x-2"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Browse Collection</span>
          </Link>

          <Link
            to="/contact"
            className="w-full sm:w-auto px-6 py-3 text-[#6E493F] hover:text-[#4A2925] text-xs font-semibold tracking-wider transition flex items-center justify-center space-x-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Support</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
