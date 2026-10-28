import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowRight, Heart } from "lucide-react";
import { getCategoriesApi } from "../../services/api";

interface FooterProps {
  onCategorySelect?: (categorySlug: string) => void;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export default function Footer({ onCategorySelect }: FooterProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategoriesApi();
        if (res.success && res.categories) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error("Failed to load categories for footer:", err);
      }
    };

    fetchCats();
  }, []);

  return (
    <footer className="w-full bg-[#4A2925] text-[#F7F2EA] pt-16 pb-8 px-6 sm:px-12 lg:px-16 border-t border-[#3D211E]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#5E3631]">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4 pr-4">
          <div className="space-y-1">
            <Link
              to="/"
              className="inline-block font-serif font-bold text-2xl tracking-tight text-[#FAF7F2] hover:opacity-90 transition-opacity"
            >
              Khushi's Zone
            </Link>
            <p className="font-['Great_Vibes',cursive] text-2xl text-[#D9CEB9]">
              "Your Points of Happiness"
            </p>
          </div>
          <p className="text-xs text-[#E5DDD0]/80 leading-relaxed max-w-sm">
            Curating timeless fashion for modern Indian women. Crafting elegant
            pieces that make everyday dressing feel truly special.
          </p>

          {/* Newsletter Input */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-[#D9CEB9] mb-2">
              Subscribe to our Newsletter
            </p>
            <div className="flex max-w-sm">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 bg-[#3D211E] text-xs text-[#F7F2EA] placeholder-[#E5DDD0]/50 rounded-l-full focus:outline-none border border-[#5E3631]"
              />
              <button
                aria-label="Subscribe"
                className="px-4 py-2 bg-[#FAF7F2] text-[#4A2925] hover:bg-[#EDE5D5] transition-colors rounded-r-full font-semibold text-xs flex items-center"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Links: Shop */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold tracking-widest uppercase text-[#D9CEB9]">
            Shop
          </h4>
          <ul className="space-y-2 text-xs text-[#E5DDD0]/80 flex flex-col">
            {categories.map((cat) => (
              <li key={cat.id}>
                <NavLink
                  to={`/category/${cat.slug}`}
                  onClick={() => onCategorySelect?.(cat.slug)}
                  className={({ isActive }) =>
                    `text-left transition-colors ${
                      isActive ? "text-white font-bold underline underline-offset-4" : "hover:text-white"
                    }`
                  }
                >
                  {cat.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Links: Customer Support */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold tracking-widest uppercase text-[#D9CEB9]">
            Customer Support
          </h4>
          <ul className="space-y-2 text-xs text-[#E5DDD0]/80">
            <li>
              <Link to="/track" className="hover:text-white transition-colors">
                Track Order
              </Link>
            </li>
            <li>
              <Link
                to="/contact#shipping"
                className="hover:text-white transition-colors"
              >
                Shipping Information
              </Link>
            </li>
            <li>
              <Link to="/contact#returns" className="hover:text-white transition-colors">
                Returns & Exchanges
              </Link>
            </li>
            <li>
              <Link
                to="/contact#size-guide"
                className="hover:text-white transition-colors"
              >
                Size Guide
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white transition-colors">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Links: About & Policies */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold tracking-widest uppercase text-[#D9CEB9]">
            About & Policies
          </h4>
          <ul className="space-y-2 text-xs text-[#E5DDD0]/80">
            <li>
              <Link
                to="/#brand-story"
                className="hover:text-white transition-colors"
              >
                Our Story
              </Link>
            </li>
            <li>
              <Link
                to="/contact#craftsmanship"
                className="hover:text-white transition-colors"
              >
                Craftsmanship
              </Link>
            </li>
            <li>
              <Link to="/contact#privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/contact#terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#E5DDD0]/60 gap-4">
        <p>© {new Date().getFullYear()} Khushi's Zone. All rights reserved.</p>
        <p className="flex items-center gap-1">
          A Unit of Awadh Groups{" "}
          <Heart className="w-3 h-3 text-red-400 fill-red-400 inline" /> for
          Fashion & Lifestyle. Made with love in India.
        </p>
      </div>
    </footer>
  );
}
