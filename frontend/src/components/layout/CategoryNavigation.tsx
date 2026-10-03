import { useState } from "react";
import { ChevronDown, Truck } from "lucide-react";

interface CategoryNavigationProps {
  onCategorySelect?: (categorySlug: string) => void;
}

export default function CategoryNavigation({
  onCategorySelect,
}: CategoryNavigationProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleCategoryClick = (slug: string) => {
    if (onCategorySelect) {
      onCategorySelect(slug);
    }
  };

  return (
    <div className="hidden lg:block w-full border-t border-[#EDE5D5] bg-[#F7F2EA]/90 px-4 sm:px-8 lg:px-12">
      <div className="w-full flex items-center justify-between h-11 text-[11px] font-semibold tracking-[0.14em] text-[#4A2925] uppercase">
        {/* Left Categories */}
        <nav className="flex items-center space-x-10">
          {/* DRESSES Dropdown */}
          <div
            className="relative py-2 group"
            onMouseEnter={() => setActiveDropdown("dresses")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={() => handleCategoryClick("dresses")}
              className="hover:text-[#8C7A6B] flex items-center space-x-1 py-1 relative transition-colors duration-200"
            >
              <span>DRESSES</span>
              <ChevronDown
                className={`w-3 h-3 text-[#8C7A6B] transition-transform duration-300 ${
                  activeDropdown === "dresses"
                    ? "rotate-180 text-[#4A2925]"
                    : ""
                }`}
              />
            </button>

            <div
              className={`absolute top-full left-0 w-60 bg-[#FAF7F2] shadow-lg border border-[#EDE5D5] rounded-b-lg py-2 px-3 z-50 transition-all duration-200 ${
                activeDropdown === "dresses"
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="space-y-1 text-xs tracking-normal font-medium normal-case text-[#4A2925]">
                <button
                  onClick={() => handleCategoryClick("dresses")}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#EDE5D5]/50 rounded transition-colors"
                >
                  Anarkali Sets
                </button>
                <button
                  onClick={() => handleCategoryClick("dresses")}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#EDE5D5]/50 rounded transition-colors"
                >
                  Kurta Suits & Gowns
                </button>
                <button
                  onClick={() => handleCategoryClick("dresses")}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#EDE5D5]/50 rounded transition-colors"
                >
                  Festive Maxi Dresses
                </button>
              </div>
            </div>
          </div>

          {/* TOPS */}
          <button
            onClick={() => handleCategoryClick("tops")}
            className="hover:text-[#8C7A6B] py-1 transition-colors duration-200"
          >
            TOPS
          </button>

          {/* BOTTOMS */}
          <button
            onClick={() => handleCategoryClick("bottoms")}
            className="hover:text-[#8C7A6B] py-1 transition-colors duration-200"
          >
            BOTTOMS
          </button>

          {/* ACCESSORIES Dropdown */}
          <div
            className="relative py-2 group"
            onMouseEnter={() => setActiveDropdown("accessories")}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={() => handleCategoryClick("accessories")}
              className="hover:text-[#8C7A6B] flex items-center space-x-1 py-1 relative transition-colors duration-200"
            >
              <span>ACCESSORIES</span>
              <ChevronDown
                className={`w-3 h-3 text-[#8C7A6B] transition-transform duration-300 ${
                  activeDropdown === "accessories"
                    ? "rotate-180 text-[#4A2925]"
                    : ""
                }`}
              />
            </button>

            <div
              className={`absolute top-full left-0 w-52 bg-[#FAF7F2] shadow-lg border border-[#EDE5D5] rounded-b-lg py-2 px-3 z-50 transition-all duration-200 ${
                activeDropdown === "accessories"
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="space-y-1 text-xs tracking-normal font-medium normal-case text-[#4A2925]">
                <button
                  onClick={() => handleCategoryClick("accessories")}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#EDE5D5]/50 rounded transition-colors"
                >
                  Jhumkas & Earrings
                </button>
                <button
                  onClick={() => handleCategoryClick("accessories")}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#EDE5D5]/50 rounded transition-colors"
                >
                  Embroidered Potlis
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Right Links */}
        <nav className="flex items-center space-x-8 text-[10px] text-[#6E493F]">
          <a
            href="#track"
            className="hover:text-[#4A2925] flex items-center space-x-1.5 transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>TRACK ORDER</span>
          </a>
          <a href="#contact" className="hover:text-[#4A2925] transition-colors">
            CONTACT
          </a>
          <a href="#account" className="hover:text-[#4A2925] transition-colors">
            MY ACCOUNT
          </a>
        </nav>
      </div>
    </div>
  );
}
