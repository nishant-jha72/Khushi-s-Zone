export type { Product } from "../services/api";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

export const MOCK_CATEGORIES: CategoryItem[] = [];
export const MOCK_PRODUCTS: any[] = [];
