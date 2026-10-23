import { useState, useEffect, useCallback } from "react";
import { MapPin, Plus, CheckCircle, AlertCircle } from "lucide-react";
import type {
  UserAddress,
  CreateAddressPayload,
} from "../../services/addressApi";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../services/addressApi";
import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";

interface AddressListProps {
  /** If provided, renders in checkout/selection mode */
  selectable?: boolean;
  selectedAddressId?: number | null;
  onSelectAddress?: (address: UserAddress) => void;
}

type Notification = { type: "success" | "error"; message: string };

// Skeleton loader for address cards
function AddressSkeleton() {
  return (
    <div className="rounded-2xl border border-[#EDE5D5] p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-5 w-24 bg-[#EDE5D5] rounded-full" />
        <div className="h-5 w-16 bg-[#EDE5D5] rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-32 bg-[#EDE5D5] rounded" />
        <div className="h-3 w-24 bg-[#EDE5D5] rounded" />
        <div className="h-3 w-48 bg-[#EDE5D5] rounded" />
        <div className="h-3 w-40 bg-[#EDE5D5] rounded" />
      </div>
    </div>
  );
}

export default function AddressList({
  selectable = false,
  selectedAddressId = null,
  onSelectAddress,
}: AddressListProps) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<UserAddress | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null); // which card is busy
  const [actionType, setActionType] = useState<"default" | "delete" | null>(
    null,
  );
  const [deleteConfirm, setDeleteConfirm] = useState<UserAddress | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  const notify = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await getAddresses();
      if (res.success) setAddresses(res.addresses);
    } catch (err: any) {
      notify("error", err.message || "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleSave = async (payload: CreateAddressPayload) => {
    setIsSaving(true);
    try {
      if (editTarget) {
        await updateAddress(editTarget.id, payload);
        notify("success", "Address updated successfully!");
      } else {
        await createAddress(payload);
        notify("success", "Address saved successfully!");
      }
      setShowForm(false);
      setEditTarget(null);
      await fetchAddresses();
    } catch (err: any) {
      notify("error", err.message || "Failed to save address");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (address: UserAddress) => {
    setEditTarget(address);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setActionId(deleteConfirm.id);
    setActionType("delete");
    setDeleteConfirm(null);
    try {
      await deleteAddress(deleteConfirm.id);
      notify("success", "Address deleted.");
      await fetchAddresses();
    } catch (err: any) {
      notify("error", err.message || "Failed to delete address");
    } finally {
      setActionId(null);
      setActionType(null);
    }
  };

  const handleSetDefault = async (address: UserAddress) => {
    setActionId(address.id);
    setActionType("default");
    try {
      await setDefaultAddress(address.id);
      notify("success", `${address.addressLine1} set as default.`);
      await fetchAddresses();
    } catch (err: any) {
      notify("error", err.message || "Failed to set default address");
    } finally {
      setActionId(null);
      setActionType(null);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-2xl text-xs font-medium border ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Add New / header */}
      {!showForm && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#4A2925]">
              {selectable ? "Choose Delivery Address" : "Saved Addresses"}
            </h3>
            <p className="text-[11px] text-[#8C7A6B]">
              {addresses.length > 0
                ? `${addresses.length} address${addresses.length > 1 ? "es" : ""} saved`
                : "No addresses saved yet"}
            </p>
          </div>
          <button
            onClick={() => {
              setEditTarget(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#4A2925] text-white rounded-full text-[11px] font-bold uppercase tracking-wide hover:bg-[#3D211E] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Address
          </button>
        </div>
      )}

      {/* Address Form */}
      {showForm && (
        <AddressForm
          editAddress={editTarget}
          onSave={handleSave}
          onCancel={handleCancelForm}
          isSaving={isSaving}
        />
      )}

      {/* Address list */}
      {!showForm && (
        <>
          {loading ? (
            <div className="space-y-4">
              <AddressSkeleton />
              <AddressSkeleton />
            </div>
          ) : addresses.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-dashed border-[#EDE5D5]">
              <MapPin className="w-10 h-10 mx-auto text-[#4A2925] opacity-20" />
              <p className="text-sm font-semibold text-[#4A2925]">
                No addresses saved
              </p>
              <p className="text-xs text-[#8C7A6B]">
                Add a delivery address to speed up checkout
              </p>
              <button
                onClick={() => {
                  setEditTarget(null);
                  setShowForm(true);
                }}
                className="mt-2 px-5 py-2.5 bg-[#4A2925] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#3D211E] transition"
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  onEdit={handleEdit}
                  onDelete={(a) => setDeleteConfirm(a)}
                  onSetDefault={handleSetDefault}
                  isSettingDefault={
                    actionId === addr.id && actionType === "default"
                  }
                  isDeleting={actionId === addr.id && actionType === "delete"}
                  selectable={selectable}
                  isSelected={selectedAddressId === addr.id}
                  onSelect={onSelectAddress}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 z-10">
            <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-serif text-base font-bold text-[#4A2925]">
                Delete this address?
              </h4>
              <p className="text-xs text-[#8C7A6B]">
                <strong>{deleteConfirm.addressLine1}</strong>,{" "}
                {deleteConfirm.city}
              </p>
              <p className="text-xs text-[#8C7A6B] mt-1">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-[#EDE5D5] text-[#4A2925] rounded-full text-xs font-bold uppercase hover:bg-[#EDE5D5] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-full text-xs font-bold uppercase hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
