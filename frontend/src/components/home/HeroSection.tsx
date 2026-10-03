import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onExploreClick?: () => void;
}

export default function HeroSection({ onExploreClick }: HeroSectionProps) {
  return (
    <section className="relative w-full bg-[#F7F2EA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-5 space-y-6 text-left z-10">
            <div className="space-y-4">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#4A2925] font-normal leading-[1.15] tracking-tight">
                Elegance,
                <br />
                <span className="italic font-serif">in every detail.</span>
              </h1>
              <p className="text-sm sm:text-base text-[#6E493F] max-w-md font-sans font-light leading-relaxed">
                Pieces that make everyday dressing feel special.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onExploreClick}
                className="inline-flex items-center space-x-3 px-8 py-3.5 bg-[#4A2925] text-[#FAF7F2] text-xs font-semibold tracking-[0.16em] uppercase rounded-full hover:bg-[#3D211E] transition-all duration-300 shadow-sm hover:shadow-md group active:scale-98"
              >
                <span>EXPLORE THE COLLECTION</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Right Image Column matching screenshot arches & tone */}
          <div className="lg:col-span-7 relative">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-[#EDE5D5]">
              <img
                src="/images/hero_banner.png"
                alt="Indian Fashion Elegance"
                className="w-full h-full object-cover object-top hover:scale-103 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#F7F2EA]/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
