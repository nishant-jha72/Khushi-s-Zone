import React, { useState, useEffect } from "react";
import {
  Ticket,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Power,
  X,
} from "lucide-react";
import {
  getAllPromosAdminApi,
  createPromoAdminApi,
  updatePromoAdminApi,
  setPromoStatusAdminApi,
  deletePromoAdminApi,
  type AdminPromoCode,
  type CreatePromoPayload,
} from "../../services/adminApi";

export const PromoManagement: React.FC = () => {
  const [promos, setPromos] = useState<AdminPromoCode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPromo, setEditingPromo] = useState<AdminPromoCode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Fields
  const [code, setCode] = useState<string>("");
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [maxDiscount, setMaxDiscount] = useState<string>("");
  const [minOrderAmount, setMinOrderAmount] = useState<string>("0");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [perUserLimit, setPerUserLimit] = useState<string>("1");
  const [startDate, setStartDate] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllPromosAdminApi();
      if (res.success && Array.isArray(res.promos)) {
        setPromos(res.promos);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPromo(null);
    setCode("");
    setDiscountType("FIXED");
    setDiscountValue("");
    setMaxDiscount("");
    setMinOrderAmount("0");
    setUsageLimit("");
    setPerUserLimit("1");
    setStartDate(new Date().toISOString().slice(0, 16));
    // Default expiry 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setExpiryDate(d.toISOString().slice(0, 16));
    setIsActive(true);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (p: AdminPromoCode) => {
    setEditingPromo(p);
    setCode(p.code);
    setDiscountType(p.discountType);
    setDiscountValue(p.discountValue.toString());
    setMaxDiscount(p.maxDiscount ? p.maxDiscount.toString() : "");
    setMinOrderAmount(p.minOrderAmount.toString());
    setUsageLimit(p.usageLimit ? p.usageLimit.toString() : "");
    setPerUserLimit(p.perUserLimit.toString());
    setStartDate(p.startDate ? new Date(p.startDate).toISOString().slice(0, 16) : "");
    setExpiryDate(p.expiryDate ? new Date(p.expiryDate).toISOString().slice(0, 16) : "");
    setIsActive(p.isActive);
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload: CreatePromoPayload = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        minOrderAmount: parseFloat(minOrderAmount || "0"),
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        perUserLimit: parseInt(perUserLimit || "1", 10),
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        expiryDate: new Date(expiryDate).toISOString(),
        isActive,
      };

      if (editingPromo) {
        await updatePromoAdminApi(editingPromo.id, payload);
        setSuccessMsg(`Promo code "${payload.code}" updated successfully.`);
      } else {
        await createPromoAdminApi(payload);
        setSuccessMsg(`Promo code "${payload.code}" created successfully.`);
      }

      setIsModalOpen(false);
      fetchPromos();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save promo code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await setPromoStatusAdminApi(id, !currentStatus);
      setSuccessMsg(`Promo code status changed.`);
      fetchPromos();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (id: number, promoCode: string) => {
    if (!window.confirm(`Are you sure you want to delete promo code "${promoCode}"?`)) {
      return;
    }

    try {
      await deletePromoAdminApi(id);
      setSuccessMsg(`Promo code "${promoCode}" was deleted.`);
      fetchPromos();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete promo code");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-pink-600" />
            Promo Codes & Coupons
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create and manage customer discounts, percentage offers, and usage restrictions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Promos Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
            <span>Loading coupons…</span>
          </div>
        ) : promos.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Ticket className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">No promo codes found</p>
            <p className="text-xs text-gray-500">Get started by creating your first promotional offer!</p>
            <button
              onClick={openCreateModal}
              className="mt-2 px-4 py-2 bg-pink-600 text-white text-xs font-bold rounded-lg"
            >
              + Create Promo Code
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Code</th>
                  <th className="py-3 px-4 font-bold">Discount</th>
                  <th className="py-3 px-4 font-bold">Min Spend</th>
                  <th className="py-3 px-4 font-bold">Redemptions</th>
                  <th className="py-3 px-4 font-bold">Limit / User</th>
                  <th className="py-3 px-4 font-bold">Expiry Date</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {promos.map((p) => {
                  const isExpired = new Date(p.expiryDate) < new Date();
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        <span className="bg-pink-50 text-pink-700 border border-pink-200 px-2.5 py-1 rounded-md text-xs">
                          {p.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        {p.discountType === "PERCENTAGE" ? (
                          <span>
                            {p.discountValue}% OFF
                            {p.maxDiscount && (
                              <span className="text-[10px] text-gray-400 block font-normal">
                                Cap: ₹{p.maxDiscount}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span>₹ {p.discountValue} OFF</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {p.minOrderAmount > 0 ? `₹ ${p.minOrderAmount}` : "None"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-900">
                          {p.usageCount}
                        </span>
                        <span className="text-gray-400">
                          {" "}
                          / {p.usageLimit !== null ? p.usageLimit : "∞"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{p.perUserLimit}x</td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <span className={isExpired ? "text-red-600 font-semibold" : ""}>
                          {new Date(p.expiryDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {isExpired && (
                          <span className="text-[9px] block text-red-500 uppercase font-bold">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(p.id, p.isActive)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            p.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          {p.isActive ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                          title="Edit coupon"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.code)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-pink-600" />
                {editingPromo ? `Edit Coupon: ${editingPromo.code}` : "Create New Coupon"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Code & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FESTIVE30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as "FIXED" | "PERCENTAGE")
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-pink-500"
                  >
                    <option value="FIXED">FIXED Amount (₹)</option>
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                  </select>
                </div>
              </div>

              {/* Value & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    {discountType === "PERCENTAGE" ? "Discount Percentage (%) *" : "Discount Amount (₹) *"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    max={discountType === "PERCENTAGE" ? "100" : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 150"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Max Discount (₹) {discountType === "FIXED" && "(N/A)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    disabled={discountType === "FIXED"}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="e.g. 300"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* Min Order & Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Min Order Spend (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-pink-600 focus:ring-pink-500 h-4 w-4"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  Enable coupon immediately
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                    </>
                  ) : editingPromo ? (
                    "Update Coupon"
                  ) : (
                    "Create Coupon"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
