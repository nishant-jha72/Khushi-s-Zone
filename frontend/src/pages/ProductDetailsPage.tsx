import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/AuthContext";
import { getProductDetailApi } from "../services/api";
import {
  Heart,
  ShoppingBag,
  ArrowLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
} from "lucide-react";

interface ProductDetailsPageProps {
  productId: string | number;
  onBack: () => void;
  onOpenAccount: (tab?: string) => void;
  onOpenAdmin?: () => void;
  onSelectCategory?: (slug: string) => void;
}

export default function ProductDetailsPage({
  productId,
  onBack,
  onOpenAccount,
  onOpenAdmin,
  onSelectCategory,
}: ProductDetailsPageProps) {
  const {
    isAuthenticated,
    wishlist,
    toggleWishlist,
    addToCart,
    totalCartCount,
  } = useAuth();
  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      onOpenAccount("login");
      return;
    }
    action();
  };

  const handleToggleWishlist = (productId: string) => {
    requireAuth(async () => {
      try {
        await toggleWishlist(productId);
      } catch (err) {
        console.error(err);
        onOpenAccount("login");
      }
    });
  };

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await getProductDetailApi(productId);
        if (res.success && res.product) {
          const p = res.product;
          setProduct(p);
          if (p.images && p.images.length > 0) {
            setSelectedImage(p.images[0].url || p.images[0]);
          } else {
            setSelectedImage(p.image_url || p.image || "");
          }
          if (p.sizes && p.sizes.length > 0) {
            setSelectedSize(p.sizes[0]);
          }
          if (p.colors && p.colors.length > 0) {
            setSelectedColor(p.colors[0].color_name);
          }
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [productId]);

  const isWishlisted = product
    ? wishlist.includes(product.id?.toString())
    : false;

  const handleAddToCart = () => {
    if (!product) return;
    const formattedProd = {
      id: product.id.toString(),
      name: product.name,
      category: product.category?.slug || "dresses",
      price: Number(product.price),
      originalPrice: product.original_price
        ? Number(product.original_price)
        : undefined,
      image: selectedImage || product.image_url || "/images/placeholder.png",
    };
    addToCart(formattedProd, 1, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F2EA] flex flex-col justify-between">
        <Header
          wishlistCount={wishlist.length}
          cartCount={totalCartCount}
          searchQuery=""
          setSearchQuery={() => {}}
          onOpenCart={() => requireAuth(() => {})}
          onOpenWishlist={() => requireAuth(() => {})}
          onOpenLogin={() => onOpenAccount("login")}
          onOpenAccount={onOpenAccount}
          onOpenAdmin={onOpenAdmin}
          onSelectCategory={onSelectCategory}
        />
        <div className="py-32 text-center space-y-4">
          <div className="w-10 h-10 border-3 border-[#4A2925] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8C7A6B] font-semibold">
            Fetching product details from database...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F7F2EA] flex flex-col justify-between">
        <Header
          wishlistCount={wishlist.length}
          cartCount={totalCartCount}
          searchQuery=""
          setSearchQuery={() => {}}
          onOpenCart={() => requireAuth(() => {})}
          onOpenWishlist={() => requireAuth(() => {})}
          onOpenLogin={() => onOpenAccount("login")}
          onOpenAccount={onOpenAccount}
          onOpenAdmin={onOpenAdmin}
          onSelectCategory={onSelectCategory}
        />
        <div className="py-24 text-center max-w-md mx-auto space-y-4">
          <h2 className="text-xl font-serif font-bold text-[#4A2925]">
            Product Not Found
          </h2>
          <p className="text-xs text-[#8C7A6B]">
            The item you're looking for might be out of stock or moved.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-[#4A2925] text-white text-xs font-semibold rounded-full"
          >
            Back to Store
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images.map((img: any) =>
          typeof img === "string" ? img : img.url,
        )
      : [product.image_url || product.image];

  const discountPercent =
    product.original_price &&
    Number(product.original_price) > Number(product.price)
      ? Math.round(
          ((Number(product.original_price) - Number(product.price)) /
            Number(product.original_price)) *
            100,
        )
      : null;

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#4A2925] font-sans antialiased flex flex-col">
      <Header
        wishlistCount={wishlist.length}
        cartCount={totalCartCount}
        searchQuery=""
        setSearchQuery={() => {}}
        onOpenCart={() => requireAuth(() => {})}
        onOpenWishlist={() => requireAuth(() => {})}
        onOpenLogin={() => onOpenAccount("login")}
        onOpenAccount={onOpenAccount}
        onOpenAdmin={onOpenAdmin}
        onSelectCategory={onSelectCategory}
      />

      {/* Breadcrumb & Navigation Header */}
      <div className="max-w-7xl w-full mx-auto px-6 sm:px-12 pt-8 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#8C7A6B] hover:text-[#4A2925] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>
      </div>

      {/* Main Details Grid */}
      <main className="max-w-7xl w-full mx-auto px-6 sm:px-12 pb-20 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Gallery (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails list */}
            {galleryImages.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[500px]">
                {galleryImages.map((imgUrl: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImage === imgUrl
                        ? "border-[#4A2925] shadow-xs scale-102"
                        : "border-[#EDE5D5] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="flex-1 relative aspect-[3/4] bg-white rounded-2xl overflow-hidden border border-[#EDE5D5] shadow-sm">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />

              {product.is_bestseller && (
                <span className="absolute top-4 left-4 bg-[#4A2925] text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.0 rounded-sm">
                  BESTSELLER
                </span>
              )}

              <button
                onClick={() => handleToggleWishlist(product.id.toString())}
                className="absolute top-4 right-4 p-3 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs text-[#4A2925] shadow-md transition hover:scale-110"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted
                      ? "fill-[#4A2925] text-[#4A2925]"
                      : "text-[#4A2925]"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right Column: Information & Actions (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 bg-white p-8 rounded-2xl border border-[#EDE5D5] shadow-xs">
            {/* Brand & Title */}
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#8C7A6B]">
                {product.brand || "KHUSHIZONE EXCLUSIVE"}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A2925] mt-1">
                {product.name}
              </h1>
              {product.sku && (
                <p className="text-[11px] text-[#8C7A6B] mt-1 font-mono">
                  SKU: {product.sku}
                </p>
              )}
            </div>

            {/* Price section */}
            <div className="flex items-baseline space-x-3 border-y border-[#EDE5D5] py-4">
              <span className="text-2xl font-bold text-[#4A2925]">
                ₹ {Number(product.price).toLocaleString("en-IN")}
              </span>
              {product.original_price &&
                Number(product.original_price) > Number(product.price) && (
                  <>
                    <span className="text-base text-[#8C7A6B] line-through">
                      ₹ {Number(product.original_price).toLocaleString("en-IN")}
                    </span>
                    {discountPercent && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </>
                )}
            </div>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A2925] mb-2">
                  Color:{" "}
                  <span className="text-[#8C7A6B] normal-case">
                    {selectedColor}
                  </span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((c: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(c.color_name)}
                      className={`w-8 h-8 rounded-full border-2 p-0.5 transition ${
                        selectedColor === c.color_name
                          ? "border-[#4A2925] scale-110"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      title={c.color_name}
                    >
                      <span
                        className="block w-full h-full rounded-full border border-black/10"
                        style={{ backgroundColor: c.hex_code || "#000" }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4A2925]">
                    Select Size
                  </label>
                  <span className="text-[11px] text-[#6E493F] cursor-pointer hover:underline">
                    Size Guide
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz: string) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                        selectedSize === sz
                          ? "bg-[#4A2925] text-white border-[#4A2925]"
                          : "bg-[#F7F2EA] text-[#4A2925] border-[#EDE5D5] hover:border-[#4A2925]"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAddToCart}
                className={`w-full py-3.5 px-6 rounded-full text-xs font-bold tracking-widest uppercase flex items-center justify-center space-x-2 transition-all shadow-md ${
                  added
                    ? "bg-emerald-800 text-white"
                    : "bg-[#4A2925] hover:bg-[#3D211E] text-white"
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ADDED TO BAG</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>ADD TO BAG</span>
                  </>
                )}
              </button>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#EDE5D5] text-center text-[10px] text-[#6E493F]">
              <div className="flex flex-col items-center space-y-1 p-2 bg-[#F7F2EA] rounded-lg">
                <Truck className="w-4 h-4 text-[#4A2925]" />
                <span className="font-semibold">Free Express Shipping</span>
              </div>
              <div className="flex flex-col items-center space-y-1 p-2 bg-[#F7F2EA] rounded-lg">
                <ShieldCheck className="w-4 h-4 text-[#4A2925]" />
                <span className="font-semibold">100% Genuine Quality</span>
              </div>
              <div className="flex flex-col items-center space-y-1 p-2 bg-[#F7F2EA] rounded-lg">
                <RotateCcw className="w-4 h-4 text-[#4A2925]" />
                <span className="font-semibold">Easy 7-Day Returns</span>
              </div>
            </div>

            {/* Description & Specs */}
            <div className="space-y-3 pt-4 border-t border-[#EDE5D5]">
              <h3 className="font-serif text-sm font-bold text-[#4A2925]">
                Product Details
              </h3>
              <p className="text-xs text-[#6E493F] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>

              {product.material && (
                <div className="text-xs text-[#4A2925]">
                  <span className="font-bold">Fabric / Material:</span>{" "}
                  {product.material}
                </div>
              )}
              {product.care_instructions && (
                <div className="text-xs text-[#4A2925]">
                  <span className="font-bold">Care:</span>{" "}
                  {product.care_instructions}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
