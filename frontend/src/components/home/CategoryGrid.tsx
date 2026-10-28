import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
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
  "from-emerald-700 to-teal-900",
];

export default function CategoryGrid({ onSelectCategory }: CategoryGridProps) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategoriesApi();
        if (res.success && res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error("Failed to fetch categories from database:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCats();
  }, []);

  if (!isLoading && categories.length === 0) {
    return null;
  }

  const handleCategoryClick = (slug: string) => {
    if (onSelectCategory) {
      onSelectCategory(slug);
    } else {
      navigate(`/category/${slug}`);
    }
  };

  return (
    <section className="w-full bg-[#F7F2EA] py-20 px-6 sm:px-10 lg:px-16 border-t border-[#EDE5D5] overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Heading with Editorial Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#EDE5D5] text-[#4A2925] text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#6E493F]" />
            <span>Curated Collections</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#4A2925] tracking-tight">
            Find your kind of beautiful
          </h2>
          <p className="text-xs sm:text-sm text-[#8C7A6B] max-w-md mx-auto font-medium">
            Explore our thoughtfully designed edits crafted to elevate your
            everyday elegance.
          </p>
          <div className="w-16 h-0.5 bg-[#8C7A6B]/40 mx-auto pt-2" />
        </div>

        {/* Loading Skeleton State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-[#EDE5D5]/60 animate-pulse rounded-2xl aspect-[4/5] w-full"
              />
            ))}
          </div>
        ) : (
          /* Modern Bento Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[280px]">
            {categories.map((cat, idx) => {
              const gradient =
                CATEGORY_GRADIENTS[idx % CATEGORY_GRADIENTS.length];

              // Make the first card span larger for a trendy bento layout (if 3 or more categories exist)
              const isLargeCard = idx === 0 && categories.length >= 3;

              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-[#EDE5D5] shadow-sm hover:shadow-xl transition-all duration-500 ${
                    isLargeCard
                      ? "md:col-span-2 md:row-span-2"
                      : "col-span-1 row-span-1"
                  }`}
                >
                  {/* Background Image or Rich Gradient */}
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${gradient} transition-transform duration-700 ease-out group-hover:scale-105 flex items-center justify-center p-8 text-center text-white`}
                    >
                      <span className="font-serif text-3xl sm:text-4xl font-bold tracking-wider drop-shadow-md">
                        {cat.name}
                      </span>
                    </div>
                  )}

                  {/* High-end Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                  {/* Featured Badge for Hero Card */}
                  {isLargeCard && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase border border-white/20">
                        Featured Edit
                      </span>
                    </div>
                  )}

                  {/* Card Content Footer */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between text-white z-10">
                    <div className="space-y-1.5 pr-4">
                      <span
                        className={`font-serif tracking-wide font-semibold block ${isLargeCard ? "text-3xl sm:text-4xl" : "text-2xl"}`}
                      >
                        {cat.name}
                      </span>
                      {cat.description && (
                        <p className="text-xs text-gray-200 line-clamp-2 font-light max-w-sm">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white group-hover:text-[#4A2925] transition-all duration-300 transform group-hover:translate-x-1 shrink-0 shadow-lg">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
