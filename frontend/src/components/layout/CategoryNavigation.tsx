import { useState, useEffect } from "react";
import { Truck } from "lucide-react";
import { getCategoriesApi } from "../../services/api";

interface CategoryNavigationProps {
  onCategorySelect?: (categorySlug: string) => void;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export default function CategoryNavigation({
  onCategorySelect,
}: CategoryNavigationProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategoriesApi();
        if (res.success && res.categories) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error("Failed to load categories for nav:", err);
      }
    };

    fetchCats();
  }, []);

  const handleCategoryClick = (slug: string) => {
    console.log('CategoryNavigation handleCategoryClick called with slug:', slug);
    console.log('CategoryNavigation button clicked:', slug);
    setSelectedCategory(slug);
    onCategorySelect?.(slug);
  };

  return (
    <div className="hidden lg:block w-full border-t border-[#EDE5D5] bg-[#F7F2EA]/90 px-4 sm:px-8 lg:px-12">
      <div className="w-full flex items-center justify-between h-11 text-[11px] font-semibold tracking-[0.14em] text-[#4A2925] uppercase">
        {/* Dynamic Categories from Database */}
        <nav className="flex items-center space-x-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`py-1 transition-colors duration-200 ${
                selectedCategory === cat.slug
                  ? "text-[#8C7A6B] font-bold"
                  : "text-[#4A2925] hover:text-[#8C7A6B]"
              }`}
              aria-pressed={selectedCategory === cat.slug}
            >
              {cat.name}
            </button>
          ))}
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
