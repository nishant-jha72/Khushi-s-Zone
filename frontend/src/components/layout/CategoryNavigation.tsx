import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
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

  return (
    <div className="hidden lg:block w-full border-t border-[#EDE5D5] bg-[#F7F2EA]/90 px-4 sm:px-8 lg:px-12">
      <div className="w-full flex items-center justify-between h-11 text-[11px] font-semibold tracking-[0.14em] text-[#4A2925] uppercase">
        {/* Dynamic Categories from Database */}
        <nav className="flex items-center space-x-8">
          {categories.map((cat) => (
            <NavLink
              key={cat.id}
              to={`/category/${cat.slug}`}
              onClick={() => onCategorySelect?.(cat.slug)}
              className={({ isActive }) =>
                `py-1 transition-colors duration-200 border-b-2 ${
                  isActive
                    ? "text-[#8C7A6B] font-bold border-[#8C7A6B]"
                    : "text-[#4A2925] hover:text-[#8C7A6B] border-transparent"
                }`
              }
            >
              {cat.name}
            </NavLink>
          ))}
        </nav>

        {/* Right Links */}
        <nav className="flex items-center space-x-8 text-[10px] text-[#6E493F]">
          <NavLink
            to="/track"
            className={({ isActive }) =>
              `hover:text-[#4A2925] flex items-center space-x-1.5 transition-colors ${
                isActive ? "text-[#4A2925] font-bold" : ""
              }`
            }
          >
            <Truck className="w-3.5 h-3.5" />
            <span>TRACK ORDER</span>
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `hover:text-[#4A2925] transition-colors ${
                isActive ? "text-[#4A2925] font-bold" : ""
              }`
            }
          >
            CONTACT
          </NavLink>

          <NavLink
            to="/account"
            className={({ isActive }) =>
              `hover:text-[#4A2925] transition-colors ${
                isActive ? "text-[#4A2925] font-bold" : ""
              }`
            }
          >
            MY ACCOUNT
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
