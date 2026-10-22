// Shared types for the redesigned Product Details page.
// Field names match what getProductDetailApi already returns from your backend.

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductColor {
  color_name: string;
  hex_code?: string;
}

export interface ProductCategory {
  slug: string;
  name?: string;
}

export interface ProductReview {
  id: string | number;
  author?: string;
  rating: number;
  comment?: string;
  created_at?: string;
}

export interface Product {
  id: number | string;
  name: string;
  description?: string;
  price: number | string;
  original_price?: number | string;
  sku?: string;
  brand?: string;
  material?: string;
  care_instructions?: string;
  fit?: string;
  silhouette?: string;
  set_includes?: string;
  model_measurements?: string;
  stock?: number; // real inventory count when tracked
  dispatch_days?: number; // real dispatch estimate when provided by backend
  shipping_info?: string;
  rating?: number; // only rendered when real data exists
  review_count?: number;
  reviews?: ProductReview[];
  is_bestseller?: boolean;
  images?: (string | ProductImage)[];
  image_url?: string;
  image?: string;
  sizes?: string[];
  colors?: ProductColor[];
  category?: ProductCategory;
}

export interface RelatedProduct {
  id: number | string;
  name: string;
  price: number | string;
  original_price?: number | string;
  image_url?: string;
  image?: string;
  rating?: number;
  review_count?: number;
}

export interface DeliveryCheckResult {
  available: boolean;
  eta?: string;
  message?: string;
}
