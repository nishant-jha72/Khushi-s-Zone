import React, { useState, useEffect } from "react";
import {
  X,
  ShoppingBag,
  MapPin,
  CheckCircle,
  Loader2,
  AlertCircle,
  Plus,
  CreditCard,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAddresses, createAddress } from "../../services/addressApi";
import type {
  UserAddress,
  CreateAddressPayload,
} from "../../services/addressApi";
import AddressCard from "../address/AddressCard";
import AddressForm from "../address/AddressForm";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: () => void;
}

type CheckoutStep = "address" | "payment" | "confirm";

export default function CheckoutModal({
  isOpen,
  onClose,
  onOrderPlaced,
}: CheckoutModalProps) {
  const { cartItems, totalCartPrice, placeOrder } = useAuth();

  const [step, setStep] = useState<CheckoutStep>("address");
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
    null,
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI / Card");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep("address");
      setOrderSuccess(false);
      setOrderError("");
      loadAddresses();
    }
  }, [isOpen]);

  const loadAddresses = async () => {
    setAddressLoading(true);
    try {
      const res = await getAddresses();
      if (res.success) {
        setAddresses(res.addresses);
        // Auto-select default
        const def =
          res.addresses.find((a: UserAddress) => a.isDefault) ||
          res.addresses[0] ||
          null;
        setSelectedAddress(def);
      }
    } catch {
      // silent
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSaveNewAddress = async (payload: CreateAddressPayload) => {
    setIsSavingAddress(true);
    try {
      const res = await createAddress(payload);
      if (res.success) {
        await loadAddresses();
        setSelectedAddress(res.address);
        setShowAddForm(false);
      }
    } catch {
      // AddressForm already shows field-level errors; list refresh happens on success
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setOrderError("Please select a delivery address to continue.");
      return;
    }
    setPlacing(true);
    setOrderError("");

    // Build a structured shipping-address snapshot (JSON) to store in orders.shipping_address
    const shippingSnapshot = JSON.stringify({
      addressId: selectedAddress.id,
      fullName: selectedAddress.fullName,
      phoneNumber: selectedAddress.phoneNumber,
      addressLine1: selectedAddress.addressLine1,
      addressLine2: selectedAddress.addressLine2 || "",
      landmark: selectedAddress.landmark || "",
      city: selectedAddress.city,
      district: selectedAddress.district || "",
      state: selectedAddress.state,
      postalCode: selectedAddress.postalCode,
      country: selectedAddress.country,
      addressType: selectedAddress.addressType,
    });

    try {
      await placeOrder({
        items: cartItems.map((ci) => ({
          itemId: ci.product.itemId || ci.product.id,
          name: ci.product.name,
          price: ci.product.price,
          quantity: ci.quantity,
          size: ci.size,
        })),
        shippingAddress: shippingSnapshot,
        paymentMethod,
      });
      setOrderSuccess(true);
      setTimeout(() => {
        onOrderPlaced();
        onClose();
      }, 2500);
    } catch (err: any) {
      setOrderError(err.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#EDE5D5] flex flex-col max-h-[90vh] z-10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EDE5D5] flex items-center justify-between bg-[#F7F2EA]">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-[#4A2925]" />
            <h2 className="font-serif text-lg font-bold text-[#4A2925]">
              {orderSuccess ? "Order Placed!" : "Checkout"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8C7A6B] hover:text-[#4A2925] hover:bg-[#EDE5D5] rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step progress */}
        {!orderSuccess && (
          <div className="px-6 py-3 border-b border-[#EDE5D5] flex gap-2 items-center">
            {(
              [
                { key: "address", label: "Address" },
                { key: "payment", label: "Payment" },
                { key: "confirm", label: "Review" },
              ] as { key: CheckoutStep; label: string }[]
            ).map((s, i) => (
              <React.Fragment key={s.key}>
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full transition-all ${
                    step === s.key
                      ? "bg-[#4A2925] text-white"
                      : "text-[#8C7A6B]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${step === s.key ? "bg-white text-[#4A2925]" : "bg-[#EDE5D5] text-[#8C7A6B]"}`}
                  >
                    {i + 1}
                  </span>
                  {s.label}
                </div>
                {i < 2 && <div className="flex-1 h-px bg-[#EDE5D5]" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {orderSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#4A2925]">
                Order Placed Successfully!
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                Your order has been confirmed. You'll receive a confirmation
                soon.
              </p>
            </div>
          ) : step === "address" ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-[#4A2925] uppercase tracking-wider">
                Select Delivery Address
              </p>

              {addressLoading ? (
                <div className="flex items-center justify-center py-10 text-xs text-[#8C7A6B] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading addresses…</span>
                </div>
              ) : showAddForm ? (
                <AddressForm
                  onSave={handleSaveNewAddress}
                  onCancel={() => setShowAddForm(false)}
                  isSaving={isSavingAddress}
                />
              ) : (
                <>
                  {addresses.length > 0 ? (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <AddressCard
                          key={addr.id}
                          address={addr}
                          onEdit={() => {}}
                          onDelete={() => {}}
                          onSetDefault={() => {}}
                          selectable
                          isSelected={selectedAddress?.id === addr.id}
                          onSelect={(a) => setSelectedAddress(a)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2 bg-white rounded-2xl border border-dashed border-[#EDE5D5]">
                      <MapPin className="w-8 h-8 mx-auto text-[#4A2925] opacity-20" />
                      <p className="text-sm font-semibold text-[#4A2925]">
                        No saved addresses
                      </p>
                      <p className="text-xs text-[#8C7A6B]">
                        Add a delivery address to continue
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[#C9B8A2] rounded-2xl text-xs font-semibold text-[#4A2925] hover:border-[#4A2925] hover:bg-[#EDE5D5]/50 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add New Address
                  </button>
                </>
              )}
            </div>
          ) : step === "payment" ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-[#4A2925] uppercase tracking-wider">
                Payment Method
              </p>
              <div className="space-y-3">
                {["UPI / Card", "Cash on Delivery", "Net Banking"].map(
                  (method) => (
                    <label
                      key={method}
                      className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === method
                          ? "border-[#4A2925] bg-[#4A2925]/5"
                          : "border-[#EDE5D5] bg-white hover:border-[#C9B8A2]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === method
                            ? "border-[#4A2925]"
                            : "border-[#D9CEB9]"
                        }`}
                      >
                        {paymentMethod === method && (
                          <div className="w-2 h-2 rounded-full bg-[#4A2925]" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#8C7A6B]" />
                        <span className="text-xs font-semibold text-[#4A2925]">
                          {method}
                        </span>
                      </div>
                      <input
                        type="radio"
                        className="sr-only"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                      />
                    </label>
                  ),
                )}
              </div>
            </div>
          ) : (
            /* step === "confirm" */
            <div className="space-y-5">
              <p className="text-xs font-semibold text-[#4A2925] uppercase tracking-wider">
                Order Summary
              </p>

              {/* Address snapshot */}
              <div className="bg-white rounded-2xl border border-[#EDE5D5] p-4 space-y-1">
                <p className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wide mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Delivering to
                </p>
                {selectedAddress && (
                  <>
                    <p className="text-xs font-semibold text-[#4A2925]">
                      {selectedAddress.fullName}
                    </p>
                    <p className="text-[11px] text-[#8C7A6B]">
                      {selectedAddress.phoneNumber}
                    </p>
                    <p className="text-[11px] text-[#8C7A6B]">
                      {selectedAddress.addressLine1}
                      {selectedAddress.addressLine2
                        ? `, ${selectedAddress.addressLine2}`
                        : ""}
                      {`, ${selectedAddress.city}, ${selectedAddress.state} – ${selectedAddress.postalCode}`}
                    </p>
                  </>
                )}
              </div>

              {/* Items */}
              <div className="bg-white rounded-2xl border border-[#EDE5D5] p-4 divide-y divide-[#EDE5D5]">
                <p className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-wide mb-2 pb-2">
                  Items
                </p>
                {cartItems.map((ci) => (
                  <div
                    key={ci.cartItemId}
                    className="flex items-center gap-3 py-3"
                  >
                    <img
                      src={ci.product.image}
                      alt={ci.product.name}
                      className="w-12 h-14 object-cover rounded-lg border border-[#EDE5D5]"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#4A2925]">
                        {ci.product.name}
                      </p>
                      <p className="text-[10px] text-[#8C7A6B]">
                        Size: {ci.size} · Qty: {ci.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-[#4A2925]">
                      ₹
                      {(ci.product.price * ci.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-[#EDE5D5] p-4 flex justify-between items-center">
                <span className="text-xs font-semibold text-[#4A2925]">
                  Payment
                </span>
                <span className="text-xs text-[#8C7A6B]">{paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center px-1">
                <span className="font-serif text-base font-bold text-[#4A2925]">
                  Total
                </span>
                <span className="font-serif text-lg font-bold text-[#4A2925]">
                  ₹ {totalCartPrice.toLocaleString("en-IN")}
                </span>
              </div>

              {orderError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {orderError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!orderSuccess && (
          <div className="px-6 py-4 border-t border-[#EDE5D5] bg-[#F7F2EA] flex items-center justify-between gap-3">
            {step !== "address" && (
              <button
                onClick={() =>
                  setStep(step === "confirm" ? "payment" : "address")
                }
                className="px-5 py-2.5 border border-[#EDE5D5] text-[#4A2925] rounded-full text-xs font-bold uppercase tracking-wide hover:bg-[#EDE5D5] transition"
              >
                Back
              </button>
            )}

            {step === "address" && (
              <button
                disabled={!selectedAddress || showAddForm}
                onClick={() => setStep("payment")}
                className="ml-auto px-6 py-2.5 bg-[#4A2925] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#3D211E] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Payment
              </button>
            )}

            {step === "payment" && (
              <button
                onClick={() => setStep("confirm")}
                className="ml-auto px-6 py-2.5 bg-[#4A2925] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#3D211E] transition"
              >
                Review Order
              </button>
            )}

            {step === "confirm" && (
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-[#4A2925] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#3D211E] transition disabled:opacity-60"
              >
                {placing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
