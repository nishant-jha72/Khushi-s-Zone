import React from "react";

export interface ProductItem {
  id: string;
  itemId?: number;
  name: string;
  category?: string;
  categoryName?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  stockStatus?: string;
  sku?: string;
  isActive?: boolean;
}

interface ProductTableProps {
  products: ProductItem[];
  isLoading: boolean;
  onEdit: (product: ProductItem) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12 text-gray-500">
        Loading product catalog...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-500 font-medium">No products found in the catalog.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Stock Status</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {products.map((p) => {
              const numericId = p.itemId || parseInt(p.id, 10);
              return (
                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={p.image || "https://via.placeholder.com/60"}
                      alt={p.name}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      {p.sku && <div className="text-xs text-gray-400">SKU: {p.sku}</div>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {p.categoryName || p.category || "Uncategorized"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">₹{p.price}</span>
                    {p.originalPrice && (
                      <span className="text-xs text-gray-400 line-through ml-2">
                        ₹{p.originalPrice}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.stockStatus === "out_of_stock"
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {p.stockStatus === "out_of_stock" ? "Out of Stock" : "In Stock"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onToggleStatus(numericId, p.isActive !== false)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        p.isActive !== false
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {p.isActive !== false ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => onEdit(p)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(numericId)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
