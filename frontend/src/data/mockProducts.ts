export type { Product } from "../services/api";
import type { Product } from "../services/api";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export const MOCK_CATEGORIES: CategoryItem[] = [
  {
    id: "cat-1",
    name: "Dresses",
    slug: "dresses",
    image: "/images/cat_dresses.png",
  },
  {
    id: "cat-2",
    name: "Tops",
    slug: "tops",
    image: "/images/cat_tops.png",
  },
  {
    id: "cat-3",
    name: "Bottoms",
    slug: "bottoms",
    image: "/images/cat_bottoms.png",
  },
  {
    id: "cat-4",
    name: "Accessories",
    slug: "accessories",
    image: "/images/cat_accessories.png",
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Maroon Embroidered Anarkali Set",
    category: "dresses",
    price: 3499,
    originalPrice: 4999,
    image: "/images/prod_maroon_anarkali.png",
    badge: "BESTSELLER",
  },
  {
    id: "prod-2",
    name: "Ivory Cotton Kurta Set",
    category: "dresses",
    price: 2899,
    originalPrice: 3999,
    image: "/images/prod_ivory_kurta.jpg",
  },
  {
    id: "prod-3",
    name: "Sage Green Co-ord Set",
    category: "tops",
    price: 2599,
    originalPrice: 3499,
    image: "/images/prod_sage_coord.jpg",
    badge: "NEW",
  },
  {
    id: "prod-4",
    name: "Embroidered Potli Bag",
    category: "accessories",
    price: 1299,
    originalPrice: 1899,
    image: "/images/prod_potli_bag.jpg",
  },
];
