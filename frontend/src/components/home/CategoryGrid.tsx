import { ArrowRight } from "lucide-react";
import { MOCK_CATEGORIES, type CategoryItem } from "../../data/mockProducts";

interface CategoryGridProps {
  onSelectCategory?: (slug: string) => void;
}

export default function CategoryGrid({ onSelectCategory }: CategoryGridProps) {
  return (
    <section className="w-full bg-[#F7F2EA] py-16 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Heading */}
        <div className="text-center space-y-3">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#4A2925] tracking-tight">
            Find your kind of beautiful
          </h2>
          <div className="w-16 h-0.5 bg-[#8C7A6B]/40 mx-auto" />
        </div>

        {/* 4 Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_CATEGORIES.map((cat: CategoryItem) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory?.(cat.slug)}
              className="group relative cursor-pointer overflow-hidden rounded-lg aspect-[4/5] bg-[#EDE5D5] shadow-xs hover:shadow-md transition-shadow duration-300"
            >
              {/* Image */}
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />

              {/* Gradient Overlay for Text Visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent transition-opacity duration-300" />

              {/* Overlay Content at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5 flex items-center justify-between text-white">
                <span className="font-serif text-2xl tracking-wide font-normal">
                  {cat.name}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#4A2925] transition-all duration-300 transform group-hover:translate-x-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
