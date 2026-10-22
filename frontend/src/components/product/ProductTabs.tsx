import { useState } from "react";
import { Star } from "lucide-react";
import type { Product } from "../types";

const TABS = ["Product Details", "Size & Fit", "Shipping & Returns", "Reviews"] as const;
type Tab = (typeof TABS)[number];

interface ProductTabsProps {
  product: Product;
}

export default function ProductTabs({ product }: ProductTabsProps) {
  const [active, setActive] = useState<Tab>("Product Details");

  const hasReviews =
    product.reviews && product.reviews.length > 0;

  return (
    <section className="bg-[#FDFBF7] rounded-2xl border border-[#EDE5D5] shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div role="tablist" aria-label="Product information" className="flex overflow-x-auto border-b border-[#EDE5D5] px-4 sm:px-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={active === tab}
            onClick={() => setActive(tab)}
            className={`whitespace-nowrap px-4 sm:px-6 py-4 text-xs font-bold tracking-wide transition border-b-2 -mb-px focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4A2925] ${
              active === tab
                ? "border-[#4A2925] text-[#4A2925]"
                : "border-transparent text-[#8C7A6B] hover:text-[#4A2925]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-6 sm:px-10 py-8">
        {active === "Product Details" && (
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-4">
              <h3 className="font-serif text-sm font-bold text-[#4A2925]">
                Product Details
              </h3>
              {product.description ? (
                <p className="text-xs text-[#6E574C] leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              ) : (
                <p className="text-xs text-[#8C7A6B] italic">
                  Detailed description coming soon.
                </p>
              )}
            </div>
            <dl className="space-y-4">
              {[
                { label: "Fabric & Material", value: product.material },
                { label: "Fit & Silhouette", value: product.fit || product.silhouette },
                { label: "Set Includes", value: product.set_includes },
                { label: "Care Instructions", value: product.care_instructions },
                { label: "Model Measurements", value: product.model_measurements },
                { label: "SKU", value: product.sku },
              ]
                .filter((row) => row.value)
                .map((row) => (
                  <div key={row.label} className="flex gap-3">
                    <dt className="w-36 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] pt-0.5">
                      {row.label}
                    </dt>
                    <dd className="text-xs text-[#4A2925] leading-relaxed">
                      {row.value}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        )}

        {active === "Size & Fit" && (
          <div className="max-w-xl space-y-3">
            <p className="text-xs text-[#6E574C] leading-relaxed">
              {product.fit || product.silhouette
                ? `This piece has a ${(product.fit || product.silhouette)!.toLowerCase()} silhouette.`
                : "Refer to the Size Guide on this page for body measurements."}
              {" "}When between sizes, we recommend sizing up for a relaxed drape.
            </p>
            {product.model_measurements && (
              <p className="text-xs text-[#8C7A6B]">
                Model: {product.model_measurements}
              </p>
            )}
          </div>
        )}

        {active === "Shipping & Returns" && (
          <div className="max-w-xl space-y-3 text-xs text-[#6E574C] leading-relaxed">
            <p>
              {product.dispatch_days != null
                ? `Orders are usually dispatched within ${product.dispatch_days} business day${product.dispatch_days > 1 ? "s" : ""}.`
                : "Orders are dispatched within 2–4 business days."}
              {" "}
              Free shipping on orders above ₹999.
            </p>
            <p>
              Easy returns within 7 days of delivery, provided the item is
              unworn with tags intact. Final sale and customised pieces are not
              eligible for return.
            </p>
            <p className="text-[#8C7A6B]">
              {product.shipping_info || "For exchange or return help, reach out via our Contact page."}
            </p>
          </div>
        )}

        {active === "Reviews" && (
          <div className="max-w-2xl space-y-6">
            {!hasReviews ? (
              <p className="text-xs text-[#8C7A6B] italic">
                No reviews yet — be the first to share your experience.
              </p>
            ) : (
              product.reviews!.map((r) => (
                <article key={r.id} className="border-b border-[#EDE5D5] pb-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < r.rating
                              ? "fill-[#4A2925] text-[#4A2925]"
                              : "text-[#D9CEB9]"
                          }`}
                        />
                      ))}
                    </span>
                    {r.author && (
                      <span className="text-[11px] font-semibold text-[#4A2925]">
                        {r.author}
                      </span>
                    )}
                  </div>
                  {r.comment && (
                    <p className="text-xs text-[#6E574C] leading-relaxed">
                      {r.comment}
                    </p>
                  )}
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
