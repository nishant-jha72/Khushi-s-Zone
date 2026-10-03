import { ArrowRight, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#4A2925] text-[#F7F2EA] pt-16 pb-8 px-6 sm:px-12 lg:px-16 border-t border-[#3D211E]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#5E3631]">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4 pr-4">
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-2xl tracking-tight text-[#FAF7F2]">
              Khushi's Zone
            </h3>
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
          <ul className="space-y-2 text-xs text-[#E5DDD0]/80">
            <li>
              <a href="#dresses" className="hover:text-white transition-colors">
                Anarkalis & Dresses
              </a>
            </li>
            <li>
              <a href="#tops" className="hover:text-white transition-colors">
                Embroidered Tops
              </a>
            </li>
            <li>
              <a href="#bottoms" className="hover:text-white transition-colors">
                Flared Bottoms
              </a>
            </li>
            <li>
              <a
                href="#accessories"
                className="hover:text-white transition-colors"
              >
                Ethnic Accessories
              </a>
            </li>
            <li>
              <a href="#new" className="hover:text-white transition-colors">
                New Arrivals
              </a>
            </li>
          </ul>
        </div>

        {/* Links: Customer Support */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold tracking-widest uppercase text-[#D9CEB9]">
            Customer Support
          </h4>
          <ul className="space-y-2 text-xs text-[#E5DDD0]/80">
            <li>
              <a href="#track" className="hover:text-white transition-colors">
                Track Order
              </a>
            </li>
            <li>
              <a
                href="#shipping"
                className="hover:text-white transition-colors"
              >
                Shipping Information
              </a>
            </li>
            <li>
              <a href="#returns" className="hover:text-white transition-colors">
                Returns & Exchanges
              </a>
            </li>
            <li>
              <a
                href="#size-guide"
                className="hover:text-white transition-colors"
              >
                Size Guide
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:text-white transition-colors">
                Contact Us
              </a>
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
              <a
                href="#brand-story"
                className="hover:text-white transition-colors"
              >
                Our Story
              </a>
            </li>
            <li>
              <a
                href="#craftsmanship"
                className="hover:text-white transition-colors"
              >
                Craftsmanship
              </a>
            </li>
            <li>
              <a href="#privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#terms" className="hover:text-white transition-colors">
                Terms of Service
              </a>
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
