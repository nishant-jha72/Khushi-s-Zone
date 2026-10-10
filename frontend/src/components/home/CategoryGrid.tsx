import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getCategoriesApi } from "../../services/api";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

interface CategoryGridProps {
  onSelectCategory?: (slug: string) => void;
}

// Fallback gradient colors when no category image is set
const CATEGORY_GRADIENTS = [
  "from-pink-500 to-rose-700",
  "from-[#6E493F] to-[#4A2925]",
  "from-amber-600 to-orange-800",
  "from-purple-600 to-indigo-800",
];

export default function CategoryGrid({ onSelectCategory }: CategoryGridProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategoriesApi();
        if (res.success && res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error("Failed to fetch categories from database:", err);
      }
    };
    fetchCats();
  }, []);

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-[#F7F2EA] py-16 px-6 sm:px-10 lg:px-16 border-t border-[#EDE5D5]">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Heading */}
        <div className="text-center space-y-3">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#4A2925] tracking-tight">
            Find your kind of beautiful
          </h2>
          <div className="w-16 h-0.5 bg-[#8C7A6B]/40 mx-auto" />
        </div>

        {/* Categories Grid from Database */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => {
            const gradient = CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length];
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory?.(cat.slug)}
                className="group relative cursor-pointer overflow-hidden rounded-xl aspect-[4/5] bg-[#EDE5D5] shadow-xs hover:shadow-lg transition-all duration-300"
              >
                {/* Background Image or Rich Gradient */}
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${gradient} transition-transform duration-500 ease-out group-hover:scale-105 flex items-center justify-center p-6 text-center text-white`}>
                    <span className="font-serif text-3xl font-bold tracking-wider drop-shadow-md">
                      {cat.name}
                    </span>
                  </div>
                )}

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300" />

                {/* Card Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-5 flex items-center justify-between text-white">
                  <div>
                    <span className="font-serif text-2xl tracking-wide font-medium block">
                      {cat.name}
                    </span>
                    {cat.description && (
                      <span className="text-[11px] text-gray-200 line-clamp-1">
                        {cat.description}
                      </span>
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-white group-hover:text-[#4A2925] transition-all duration-300 transform group-hover:translate-x-1 flex-shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
