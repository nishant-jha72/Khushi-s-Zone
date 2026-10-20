import { useState, useEffect, useRef } from "react";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Package,
  ChevronDown,
} from "lucide-react";
import AnnouncementBar from "./AnnouncementBar";
import CategoryNavigation from "./CategoryNavigation";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  wishlistCount: number;
  cartCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenLogin: () => void;
  onOpenAccount: (tab?: string) => void;
  onOpenAdmin?: () => void;
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
  onOpenAccount,
  onOpenAdmin,
  onSelectCategory,
}: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

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
          setIsVisible(false);
        } else {
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

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex items-center space-x-3 sm:space-x-4 group"
              >
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

              {/* LOGGED IN USER MENUS vs LOGGED OUT BUTTON */}
              {isAuthenticated && user ? (
                <div className="relative hidden sm:block" ref={dropdownRef}>
                  <button
                    onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#EDE5D5] border border-[#D9CEB9] text-[#4A2925] hover:bg-[#E5DAC8] transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#4A2925] text-[#F7F2EA] flex items-center justify-center text-[10px] font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold max-w-[120px] truncate">
                      Hi, {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8C7A6B]" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-[#FAF7F2] rounded-2xl shadow-xl border border-[#EDE5D5] py-2 z-50 divide-y divide-[#EDE5D5] animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2.5">
                        <p className="text-xs font-bold text-[#4A2925] truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-[#8C7A6B] truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            onOpenAccount("profile");
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-[#4A2925] hover:bg-[#EDE5D5]/60 transition-colors text-left font-medium"
                        >
                          <UserIcon className="w-4 h-4 text-[#8C7A6B]" />
                          <span>My Account</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            onOpenAccount("orders");
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-[#4A2925] hover:bg-[#EDE5D5]/60 transition-colors text-left font-medium"
                        >
                          <Package className="w-4 h-4 text-[#8C7A6B]" />
                          <span>Past Orders</span>
                        </button>
                        {user.isAdmin && onOpenAdmin && (
                          <button
                            onClick={() => {
                              setIsUserDropdownOpen(false);
                              onOpenAdmin();
                            }}
                            className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-pink-700 bg-pink-50 hover:bg-pink-100 transition-colors text-left font-bold"
                          >
                            <Package className="w-4 h-4 text-pink-700" />
                            <span>Admin Portal ⚙️</span>
                          </button>
                        )}
                      </div>

                      <div className="py-1">
                        <button
                          onClick={async () => {
                            setIsUserDropdownOpen(false);
                            await logout();
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-red-700 hover:bg-red-50 transition-colors text-left font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Login / Signup Outlined Button */
                <button
                  onClick={onOpenLogin}
                  className="hidden sm:inline-flex items-center justify-center px-5 py-1.5 border border-[#4A2925] text-[#4A2925] hover:bg-[#4A2925] hover:text-[#F7F2EA] text-[11px] font-semibold tracking-wider uppercase rounded-full transition-all duration-200"
                >
                  LOGIN / SIGNUP
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Secondary Navigation */}
        <CategoryNavigation onCategorySelect={onSelectCategory} />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] flex lg:hidden">
          {/* Backdrop overlay spanning entire screen */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sliding drawer navigation */}
          <div className="relative w-full max-w-xs bg-[#F7F2EA] h-full min-h-[100dvh] max-h-[100dvh] shadow-2xl flex flex-col justify-between z-10 p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EDE5D5]">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-bold text-xl text-[#4A2925]">
                    Khushi's Zone
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-[#4A2925] hover:opacity-75 transition-opacity"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="py-3">
                <p className="font-['Great_Vibes',cursive] text-lg text-[#6E493F]">
                  "Your Points of Happiness"
                </p>
              </div>

              {/* Mobile User Welcome Badge */}
              {isAuthenticated && user && (
                <div className="p-3 bg-[#EDE5D5] rounded-xl mb-4 border border-[#D9CEB9] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#4A2925] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#4A2925] truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-[#8C7A6B] truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Search */}
              <div className="my-3 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C7A6B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Explore styles..."
                  className="w-full pl-9 pr-8 py-2 bg-[#EDE5D5] text-xs rounded-full border-none focus:outline-none text-[#4A2925] placeholder-[#8C7A6B]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#8C7A6B]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Links */}
              <nav className="mt-4 space-y-2 text-xs font-semibold tracking-wider text-[#4A2925] uppercase">
                <button
                  onClick={() => {
                    onSelectCategory?.("dresses");
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2.5 border-b border-[#EDE5D5]/60 hover:text-[#6E493F]"
                >
                  DRESSES
                </button>
                <button
                  onClick={() => {
                    onSelectCategory?.("tops");
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2.5 border-b border-[#EDE5D5]/60 hover:text-[#6E493F]"
                >
                  TOPS
                </button>
                <button
                  onClick={() => {
                    onSelectCategory?.("bottoms");
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2.5 border-b border-[#EDE5D5]/60 hover:text-[#6E493F]"
                >
                  BOTTOMS
                </button>
                <button
                  onClick={() => {
                    onSelectCategory?.("accessories");
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2.5 border-b border-[#EDE5D5]/60 hover:text-[#6E493F]"
                >
                  ACCESSORIES
                </button>

                {/* Authenticated Links in Menu */}
                {isAuthenticated && (
                  <>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAccount("profile");
                      }}
                      className="w-full flex items-center space-x-2 py-2.5 border-b border-[#EDE5D5]/60 hover:text-[#6E493F]"
                    >
                      <UserIcon className="w-4 h-4 text-[#8C7A6B]" />
                      <span>MY ACCOUNT</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAccount("orders");
                      }}
                      className="w-full flex items-center space-x-2 py-2.5 border-b border-[#EDE5D5]/60 hover:text-[#6E493F]"
                    >
                      <Package className="w-4 h-4 text-[#8C7A6B]" />
                      <span>PAST ORDERS</span>
                    </button>
                    {user?.isAdmin && onOpenAdmin && (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenAdmin();
                        }}
                        className="w-full flex items-center space-x-2 py-2.5 border-b border-[#EDE5D5]/60 text-pink-700 font-bold"
                      >
                        <Package className="w-4 h-4 text-pink-700" />
                        <span>ADMIN PORTAL ⚙️</span>
                      </button>
                    )}
                  </>
                )}
              </nav>
            </div>

            {/* Bottom Footer Actions */}
            <div className="pt-6 mt-6 border-t border-[#EDE5D5] space-y-3 shrink-0">
              {isAuthenticated ? (
                <button
                  onClick={async () => {
                    setIsMobileMenuOpen(false);
                    await logout();
                  }}
                  className="w-full py-2.5 bg-red-800 text-white text-xs font-semibold tracking-wider uppercase rounded-full flex items-center justify-center space-x-2 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>LOGOUT</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full py-2.5 bg-[#4A2925] text-[#F7F2EA] text-xs font-semibold tracking-wider uppercase rounded-full shadow-sm"
                >
                  LOGIN / SIGNUP
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
