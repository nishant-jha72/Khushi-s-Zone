import { useState, useEffect } from "react";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import AnnouncementBar from "./AnnouncementBar";
import CategoryNavigation from "./CategoryNavigation";

interface HeaderProps {
  wishlistCount: number;
  cartCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenLogin: () => void;
  onSelectCategory?: (category: string) => void;
}

export default function Header({
  wishlistCount,
  cartCount,
  searchQuery,
  setSearchQuery,
  onOpenCart,
  onOpenWishlist,
  onOpenLogin,
  onSelectCategory,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY) {
          // Scrolling down -> hide navbar
          setIsVisible(false);
        } else {
          // Scrolling up -> show navbar
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-40 w-full transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Top Announcement Bar */}
      <AnnouncementBar />

      {/* Main Navbar */}
      <div
        className={`w-full bg-[#F7F2EA]/95 backdrop-blur-md border-b border-[#EDE5D5] transition-shadow duration-300 ${
          isScrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="w-full px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Mobile menu button & Brand Emblem */}
            <div className="flex items-center space-x-3 sm:space-x-6">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-1.5 text-[#4A2925] hover:opacity-80 transition-opacity"
                aria-label="Open mobile menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <a
                href="#"
                className="flex items-center space-x-3 sm:space-x-4 group"
              >
                {/* Visual Brand Monogram Emblem matching logo & reference image */}
                <div className="flex items-center space-x-2">
                  <img
                    src="/images/logo.png"
                    alt="Khushi's Zone Logo"
                    className="h-10 sm:h-12 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="flex flex-col">
                    <div className="flex items-baseline font-serif font-bold text-2xl sm:text-3xl text-[#4A2925] tracking-tight leading-none">
                      <span>Khushi's Zone</span>
                    </div>
                    <span className="font-['Great_Vibes',cursive] text-lg sm:text-xl text-[#6E493F] -mt-1 leading-tight whitespace-nowrap">
                      Your Points of Happiness
                    </span>
                  </div>
                </div>
              </a>
            </div>

            {/* Center: Search Input Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-6 relative">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C7A6B]">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Explore styles..."
                  className="w-full pl-9 pr-8 py-2 bg-[#EDE5D5]/60 hover:bg-[#EDE5D5] focus:bg-white text-xs font-medium text-[#4A2925] placeholder-[#8C7A6B] rounded-full focus:outline-none focus:ring-1 focus:ring-[#4A2925] border border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#8C7A6B] hover:text-[#4A2925]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Wishlist Heart Icon */}
              <button
                onClick={onOpenWishlist}
                className="p-2 text-[#4A2925] hover:text-[#6E493F] transition-colors relative group"
                aria-label="Wishlist"
                title="Wishlist"
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.75]" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#4A2925] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Shopping Bag Icon */}
              <button
                onClick={onOpenCart}
                className="p-2 text-[#4A2925] hover:text-[#6E493F] transition-colors relative"
                aria-label="Shopping Bag"
                title="Shopping Bag"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.75]" />
                <span className="absolute -top-0.5 -right-0.5 bg-[#4A2925] text-[#F7F2EA] text-[10px] font-bold w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-[#F7F2EA]">
                  {cartCount}
                </span>
              </button>

              {/* Login / Signup Outlined Button */}
              <button
                onClick={onOpenLogin}
                className="hidden sm:inline-flex items-center justify-center px-5 py-1.5 border border-[#4A2925] text-[#4A2925] hover:bg-[#4A2925] hover:text-[#F7F2EA] text-[11px] font-semibold tracking-wider uppercase rounded-full transition-all duration-200"
              >
                LOGIN / SIGNUP
              </button>
            </div>
          </div>
        </div>

        {/* Category Secondary Navigation */}
        <CategoryNavigation onCategorySelect={onSelectCategory} />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-[#F7F2EA] h-full shadow-2xl flex flex-col justify-between z-10 p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EDE5D5]">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-bold text-xl text-[#4A2925]">
                    Kashis Zare
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-[#4A2925]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="py-4">
                <p className="font-['Great_Vibes',cursive] text-xl text-[#6E493F]">
                  "Your Points of Happiness"
                </p>
              </div>

              {/* Mobile Search */}
              <div className="my-3 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C7A6B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Explore styles..."
                  className="w-full pl-9 pr-3 py-2 bg-[#EDE5D5] text-xs rounded-full border-none focus:outline-none text-[#4A2925]"
                />
              </div>

              <nav className="mt-4 space-y-3 text-xs font-semibold tracking-wider text-[#4A2925] uppercase">
                <button
                  onClick={() => {
                    onSelectCategory?.("dresses");
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 border-b border-[#EDE5D5]/60 hover:text-[#6E493F]"
                >
                  DRESSES
                </button>
                <button
                  onClick={() => {
                    onSelectCategory?.("tops");
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 border-b border-[#EDE5D5]/60 hover:text-[#6E493F]"
                >
                  TOPS
                </button>
                <button
                  onClick={() => {
                    onSelectCategory?.("bottoms");
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 border-b border-[#EDE5D5]/60 hover:text-[#6E493F]"
                >
                  BOTTOMS
                </button>
                <button
                  onClick={() => {
                    onSelectCategory?.("accessories");
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 border-b border-[#EDE5D5]/60 hover:text-[#6E493F]"
                >
                  ACCESSORIES
                </button>
                <a
                  href="#track"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 border-b border-[#EDE5D5]/60 hover:text-[#6E493F]"
                >
                  TRACK ORDER
                </a>
                <a
                  href="#account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 border-b border-[#EDE5D5]/60 hover:text-[#6E493F]"
                >
                  MY ACCOUNT
                </a>
              </nav>
            </div>

            <div className="pt-6 border-t border-[#EDE5D5] space-y-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-2.5 bg-[#4A2925] text-[#F7F2EA] text-xs font-semibold tracking-wider uppercase rounded-full"
              >
                LOGIN / SIGNUP
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
