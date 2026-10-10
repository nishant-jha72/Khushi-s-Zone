import React, { useState, useEffect } from "react";
import {
  createProductApi,
  updateProductApi,
  getCategoriesApi,
  uploadProductMediaApi,
  addProductColorApi,
  upsertVariantApi,
} from "../../services/adminApi";
import { ImageUploadZone } from "./ImageUploadZone";

interface AddEditProductFormProps {
  initialProduct?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

export const AddEditProductForm: React.FC<AddEditProductFormProps> = ({
  initialProduct,
  onSuccess,
  onCancel,
}) => {
  const isEdit = Boolean(initialProduct);

  const [step, setStep] = useState<number>(1);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 & 2 Form Data
  const [name, setName] = useState(initialProduct?.name || "");
  const [categoryId, setCategoryId] = useState<number | "">(initialProduct?.categoryId || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [type, setType] = useState(initialProduct?.type || "Dresses");
  const [brand, setBrand] = useState(initialProduct?.brand || "KhushiZone");
  const [material, setMaterial] = useState(initialProduct?.material || "");
  const [careInstructions, setCareInstructions] = useState(initialProduct?.careInstructions || "");

  const [price, setPrice] = useState<number | "">(initialProduct?.price || "");
  const [originalPrice, setOriginalPrice] = useState<number | "">(initialProduct?.originalPrice || "");
  const [sku, setSku] = useState(initialProduct?.sku || "");
  const [stockStatus, setStockStatus] = useState(initialProduct?.stockStatus || "in_stock");
  const [isBestseller, setIsBestseller] = useState(initialProduct?.isBestseller || false);

  // Step 3 Form Data
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialProduct?.sizes || ["S", "M", "L"]);
  const [colors, setColors] = useState<{ colorName: string; hexCode: string }[]>(
    initialProduct?.colors || [{ colorName: "Default", hexCode: "#000000" }]
  );

  // Step 4 Images
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [createdProductId, setCreatedProductId] = useState<number | null>(
    initialProduct?.itemId || initialProduct?.id || null
  );

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategoriesApi();
        if (res.success && res.categories) {
          setCategories(
            res.categories.map((c: any) => ({ id: parseInt(c.id, 10), name: c.name }))
          );
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCats();
  }, []);

  const toggleSize = (sz: string) => {
    if (selectedSizes.includes(sz)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== sz));
    } else {
      setSelectedSizes([...selectedSizes, sz]);
    }
  };

  const addColorRow = () => {
    setColors([...colors, { colorName: "", hexCode: "#000000" }]);
  };

  const handleColorChange = (index: number, field: "colorName" | "hexCode", val: string) => {
    const next = [...colors];
    next[index][field] = val;
    setColors(next);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Product name is required.");
    if (!description.trim()) return setError("Description is required.");
    if (!price || Number(price) <= 0) return setError("Valid price is required.");

    try {
      setIsLoading(true);
      const payload = {
        name,
        categoryId: categoryId ? Number(categoryId) : null,
        description,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        sizes: selectedSizes,
        type,
        brand,
        material,
        careInstructions,
        sku: sku || undefined,
        stockStatus,
        isBestseller,
      };

      let prodId = createdProductId;

      if (isEdit && prodId) {
        await updateProductApi(prodId, payload);
      } else {
        const res = await createProductApi(payload);
        prodId = res.product.id;
        setCreatedProductId(prodId);
      }

      // Add colors & variants if available
      if (prodId) {
        for (const c of colors) {
          if (c.colorName.trim()) {
            await addProductColorApi(prodId, c.colorName, c.hexCode);
          }
        }
        for (const sz of selectedSizes) {
          await upsertVariantApi(prodId, {
            size: sz,
            price: Number(price),
            stockQuantity: 50,
          });
        }
      }

      // Upload pending files if any
      if (prodId && pendingFiles.length > 0) {
        await uploadProductMediaApi(prodId, pendingFiles);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save product details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {isEdit ? "Edit Product" : "Add New Product"}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 font-medium text-sm"
        >
          Cancel
        </button>
      </div>

      {/* Stepper Header */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { num: 1, title: "1. Basic Info" },
          { num: 2, title: "2. Pricing & Stock" },
          { num: 3, title: "3. Sizes & Colors" },
          { num: 4, title: "4. Images" },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-colors ${
              step === s.num
                ? "border-pink-600 text-pink-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveProduct}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Elegant Floral Maxi Dress"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Clothing Type
                </label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g. Dresses, Tops, Sarees"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of fit, fabric, and styling tips..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Material</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. 100% Cotton, Georgette"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Care Instructions</label>
                <input
                  type="text"
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  placeholder="e.g. Dry clean only"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing & Stock */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="1499"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Original Price / MRP (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="2499"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="KZ-DRS-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Stock Status
                </label>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  className="w-5 h-5 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Mark as Bestseller / Featured Product
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Sizes & Colors */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Available Sizes
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SIZES.map((sz) => {
                  const isSelected = selectedSizes.includes(sz);
                  return (
                    <button
                      type="button"
                      key={sz}
                      onClick={() => toggleSize(sz)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                        isSelected
                          ? "bg-pink-600 text-white border-pink-600"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Color Variants
                </label>
                <button
                  type="button"
                  onClick={addColorRow}
                  className="text-xs font-semibold text-pink-600 hover:text-pink-700"
                >
                  + Add Color
                </button>
              </div>

              <div className="space-y-3">
                {colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Color Name (e.g. Crimson Red)"
                      value={c.colorName}
                      onChange={(e) => handleColorChange(i, "colorName", e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    />
                    <input
                      type="color"
                      value={c.hexCode || "#000000"}
                      onChange={(e) => handleColorChange(i, "hexCode", e.target.value)}
                      className="w-10 h-10 border border-gray-300 rounded-lg p-0.5 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Images */}
        {step === 4 && (
          <ImageUploadZone
            productId={createdProductId || undefined}
            existingImages={initialProduct?.images}
            onImagesChange={(files) => setPendingFiles(files)}
          />
        )}

        {/* Form Controls */}
        <div className="flex items-center justify-between border-t border-gray-200 mt-8 pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
            >
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
            >
              {isLoading ? "Saving Product..." : isEdit ? "Update Product" : "Publish Product"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
