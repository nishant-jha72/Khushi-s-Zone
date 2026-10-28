import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getAllProductsAdminApi,
  deleteProductApi,
  setProductStatusApi,
} from "../../services/adminApi";
import { ProductTable, type ProductItem } from "../../components/admin/ProductTable";
import { AddEditProductForm } from "../../components/admin/AddEditProductForm";

interface AdminPageProps {
  onBackToHome?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToHome }) => {
  const navigate = useNavigate();
  const handleBack = onBackToHome || (() => navigate("/"));
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"products" | "add_product">("products");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await getAllProductsAdminApi(1, 50);
      if (res.success && res.products) {
        setProducts(res.products);
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to load products" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: ProductItem) => {
    setEditingProduct(product);
    setActiveTab("add_product");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product? This will also remove images from Cloudinary.")) {
      return;
    }
    try {
      await deleteProductApi(id);
      setNotification({ type: "success", text: "Product deleted successfully." });
      fetchProducts();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to delete product." });
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await setProductStatusApi(id, !currentStatus);
      setNotification({
        type: "success",
        text: `Product ${!currentStatus ? "activated" : "deactivated"} successfully.`,
      });
      fetchProducts();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to update product status." });
    }
  };

  const handleFormSuccess = () => {
    setNotification({
      type: "success",
      text: editingProduct ? "Product updated successfully!" : "Product published successfully!",
    });
    setEditingProduct(null);
    setActiveTab("products");
    fetchProducts();
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center max-w-md shadow-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-sm text-gray-600 mb-6">
            You don't have permission to access the seller panel. Please sign in as an admin user.
          </p>
          <button
            onClick={handleBack}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black transition cursor-pointer"
          >
            Return to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              KhushiZone
            </span>
            <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-gray-900">{user.name}</div>
              <div className="text-[10px] text-gray-500">{user.email}</div>
            </div>
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg transition cursor-pointer"
            >
              Back to Storefront ↗
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {notification && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{notification.text}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-xs opacity-60 hover:opacity-100 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Add new catalog items, upload Cloudinary images, and update inventory details.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingProduct(null);
                setActiveTab("products");
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === "products"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              All Products ({products.length})
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setActiveTab("add_product");
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === "add_product"
                  ? "bg-pink-600 text-white"
                  : "bg-pink-50 text-pink-600 hover:bg-pink-100"
              }`}
            >
              + Add New Product
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === "products" ? (
          <ProductTable
            products={products}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        ) : (
          <AddEditProductForm
            initialProduct={editingProduct}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setEditingProduct(null);
              setActiveTab("products");
            }}
          />
        )}
      </div>
    </div>
  );
};
