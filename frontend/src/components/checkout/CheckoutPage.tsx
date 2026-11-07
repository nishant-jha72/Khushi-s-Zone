import { useState, useEffect } from "react";
import {
  MapPin,
  CheckCircle,
  Loader2,
  AlertCircle,
  Plus,
  CreditCard,
  ArrowLeft,
  Tag,
  Ticket,
  Sparkles,
  X,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAddresses, createAddress } from "../../services/addressApi";
import type {
  UserAddress,
  CreateAddressPayload,
} from "../../services/addressApi";
import {
  validatePromoApi,
  getAvailablePromosApi,
  type PromoCode,
} from "../../services/api";
import AddressCard from "../address/AddressCard";
import AddressForm from "../address/AddressForm";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, totalCartPrice, placeOrder } = useAuth();

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

  // Promo Code States
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [availablePromos, setAvailablePromos] = useState<PromoCode[]>([]);
  const [isLoadingPromos, setIsLoadingPromos] = useState(false);

  useEffect(() => {
    // Redirect back to cart if cart is empty
    if (cartItems.length === 0 && !orderSuccess) {
      navigate("/cart");
      return;
    }
    loadAddresses();
    loadAvailablePromos();
  }, [cartItems]);

  // Recalculate/validate promo when cart items change
  useEffect(() => {
    if (appliedPromo && cartItems.length > 0) {
      validatePromoApi(appliedPromo.code, cartItems)
        .then((res) => {
          if (res.success) {
            setPromoDiscount(res.calculation.discount);
          } else {
            handleRemovePromo();
            setPromoFeedback({
              type: "error",
              message:
                "Applied coupon was removed as cart contents no longer satisfy requirements.",
            });
          }
        })
        .catch(() => {
          handleRemovePromo();
        });
    }
  }, [cartItems]);

  const loadAddresses = async () => {
    setAddressLoading(true);
    try {
      const res = await getAddresses();
      if (res.success) {
        setAddresses(res.addresses);
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

  const loadAvailablePromos = async () => {
    setIsLoadingPromos(true);
    try {
      const res = await getAvailablePromosApi();
      if (res.success && Array.isArray(res.promos)) {
        setAvailablePromos(res.promos);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingPromos(false);
    }
  };

  const handleApplyPromo = async (codeOverride?: string) => {
    const codeToApply = (codeOverride || promoInput).trim().toUpperCase();
    if (!codeToApply) {
      setPromoFeedback({
        type: "error",
        message: "Please enter a valid coupon code.",
      });
      return;
    }

    setIsApplyingPromo(true);
    setPromoFeedback(null);

    try {
      const res = await validatePromoApi(codeToApply, cartItems);
      if (res.success) {
        setAppliedPromo(res.promo);
        setPromoDiscount(res.calculation.discount);
        setPromoInput(res.promo.code);
        setPromoFeedback({
          type: "success",
          message: `Coupon "${res.promo.code}" applied successfully! You saved ₹${res.calculation.discount.toLocaleString("en-IN")}.`,
        });
      } else {
        setPromoFeedback({
          type: "error",
          message: res.message || "Failed to apply coupon.",
        });
      }
    } catch (err: any) {
      setPromoFeedback({
        type: "error",
        message: err.message || "Invalid coupon code.",
      });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoInput("");
    setPromoFeedback(null);
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
      // Field-level errors handled in AddressForm
    } finally {
      setIsSavingAddress(false);
    }
  };

  const finalPayable = Math.max(0, totalCartPrice - promoDiscount);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setOrderError("Please select a delivery address to continue.");
      return;
    }
    setPlacing(true);
    setOrderError("");

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
        promoCode: appliedPromo ? appliedPromo.code : undefined,
      });
      setOrderSuccess(true);
      setTimeout(() => {
        navigate("/orders");
      }, 2500);
    } catch (err: any) {
      setOrderError(err.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-[#EDE5D5] shadow-xl text-center space-y-4 max-w-md w-full">
          <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#4A2925]">
            Order Placed Successfully!
          </h3>
          <p className="text-xs text-[#8C7A6B]">
            Your order has been confirmed. Redirecting you to your orders…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#EDE5D5] pb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-semibold text-[#8C7A6B] hover:text-[#4A2925] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="font-serif text-xl font-bold text-[#4A2925]">
            Secure Checkout
          </h1>
          <div className="w-12" /> {/* Spacer for symmetry */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Delivery Address, Coupons, Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Delivery Address */}
            <div className="bg-white rounded-3xl border border-[#EDE5D5] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDE5D5] pb-3">
                <p className="text-xs font-bold text-[#4A2925] uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#8C7A6B]" /> 1. Select
                  Delivery Address
                </p>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1 text-xs font-bold text-[#4A2925] hover:text-[#3D211E] transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New
                  </button>
                )}
              </div>

              {addressLoading ? (
                <div className="flex items-center justify-center py-8 text-xs text-[#8C7A6B] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#4A2925]" />
                  Loading delivery addresses…
                </div>
              ) : showAddForm ? (
                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE5D5] space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-[#4A2925]">
                      Enter Address Details
                    </p>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="text-xs text-[#8C7A6B] hover:text-[#4A2925]"
                    >
                      Cancel
                    </button>
                  </div>
                  <AddressForm
                    onSave={handleSaveNewAddress}
                    onCancel={() => setShowAddForm(false)}
                    isSaving={isSavingAddress}
                  />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8 space-y-3 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#EDE5D5] p-6">
                  <MapPin className="w-8 h-8 mx-auto text-[#8C7A6B] opacity-40" />
                  <p className="text-xs text-[#8C7A6B]">
                    No delivery address saved yet. Please add an address to
                    proceed with your order.
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-5 py-2 bg-[#4A2925] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#3D211E] transition"
                  >
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr)}
                      className="cursor-pointer"
                    >
                      <AddressCard
                        address={addr}
                        selectable={true}
                        isSelected={selectedAddress?.id === addr.id}
                        onSelect={() => setSelectedAddress(addr)}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onSetDefault={() => {}}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Promo Code / Offers */}
            <div className="bg-white rounded-3xl border border-[#EDE5D5] p-6 shadow-sm space-y-4">
              <div className="border-b border-[#EDE5D5] pb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-[#4A2925] uppercase tracking-wider flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-[#8C7A6B]" /> 2. Apply Coupon
                  / Promo Code
                </p>
                {appliedPromo && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    <Check className="w-3 h-3" /> {appliedPromo.code} Applied
                  </span>
                )}
              </div>

              {appliedPromo ? (
                /* Applied State Banner */
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-emerald-900 tracking-wider">
                          {appliedPromo.code}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-md">
                          {appliedPromo.discountType === "PERCENTAGE"
                            ? `${appliedPromo.discountValue}% OFF`
                            : `FLAT ₹${appliedPromo.discountValue} OFF`}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        You saved{" "}
                        <strong>
                          ₹ {promoDiscount.toLocaleString("en-IN")}
                        </strong>{" "}
                        on this order!
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRemovePromo}
                    className="p-2 text-emerald-800 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="Remove coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Coupon Input Box */
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]" />
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value.toUpperCase());
                          if (promoFeedback) setPromoFeedback(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyPromo();
                          }
                        }}
                        placeholder="ENTER COUPON CODE"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#EDE5D5] rounded-xl text-xs font-mono font-bold text-[#4A2925] uppercase placeholder:font-sans placeholder:normal-case placeholder:font-normal placeholder-[#8C7A6B] focus:outline-none focus:border-[#4A2925] transition"
                      />
                    </div>
                    <button
                      onClick={() => handleApplyPromo()}
                      disabled={isApplyingPromo || !promoInput.trim()}
                      className="px-6 py-2.5 bg-[#4A2925] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#3D211E] transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {isApplyingPromo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Applying…</span>
                        </>
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>

                  {/* Feedback Message */}
                  {promoFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        promoFeedback.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {promoFeedback.type === "success" ? (
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      )}
                      <span>{promoFeedback.message}</span>
                    </div>
                  )}

                  {/* Available Coupons Pills */}
                  {isLoadingPromos ? (
                    <div className="flex items-center gap-2 text-[11px] text-[#8C7A6B] pt-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4A2925]" />
                      <span>Checking available offers…</span>
                    </div>
                  ) : (
                    availablePromos.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider mb-2">
                          Available Offers for You
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {availablePromos.map((promo) => {
                            const isEligible =
                              totalCartPrice >= promo.minOrderAmount;
                            return (
                              <div
                                key={promo.id}
                                className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition ${
                                  isEligible
                                    ? "bg-[#FAF7F2] border-[#EDE5D5] hover:border-[#4A2925]"
                                    : "bg-gray-50 border-gray-200 opacity-60"
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs font-bold text-[#4A2925] bg-white px-2 py-0.5 rounded border border-[#EDE5D5]">
                                      {promo.code}
                                    </span>
                                    <span className="text-[10px] font-semibold text-emerald-800">
                                      {promo.discountType === "PERCENTAGE"
                                        ? `${promo.discountValue}% OFF`
                                        : `₹${promo.discountValue} OFF`}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-[#8C7A6B]">
                                    {promo.minOrderAmount > 0
                                      ? `On orders above ₹${promo.minOrderAmount}`
                                      : "No minimum spend required"}
                                    {promo.maxDiscount
                                      ? ` (Max ₹${promo.maxDiscount})`
                                      : ""}
                                  </p>
                                </div>

                                <button
                                  onClick={() => handleApplyPromo(promo.code)}
                                  disabled={isApplyingPromo}
                                  className="px-3 py-1 bg-white border border-[#4A2925] text-[#4A2925] rounded-lg text-[10px] font-bold uppercase hover:bg-[#4A2925] hover:text-white transition cursor-pointer shrink-0 disabled:opacity-50"
                                >
                                  Apply
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Section 3: Payment Method */}
            <div className="bg-white rounded-3xl border border-[#EDE5D5] p-6 shadow-sm space-y-4">
              <div className="border-b border-[#EDE5D5] pb-3">
                <p className="text-xs font-bold text-[#4A2925] uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#8C7A6B]" /> 3. Payment
                  Method
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          paymentMethod === method
                            ? "border-[#4A2925]"
                            : "border-[#D9CEB9]"
                        }`}
                      >
                        {paymentMethod === method && (
                          <div className="w-2 h-2 rounded-full bg-[#4A2925]" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-[#4A2925]">
                        {method}
                      </span>
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
          </div>

          {/* Right Column: Sticky Order Summary */}
          <div className="lg:col-span-1 sticky top-8 space-y-4">
            <div className="bg-white rounded-3xl border border-[#EDE5D5] p-6 shadow-sm space-y-5">
              <h2 className="font-serif text-base font-bold text-[#4A2925] border-b border-[#EDE5D5] pb-3">
                Order Summary
              </h2>

              {/* Items List */}
              <div className="divide-y divide-[#EDE5D5] max-h-60 overflow-y-auto pr-1">
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
                      <p className="text-xs font-semibold text-[#4A2925] line-clamp-1">
                        {ci.product.name}
                      </p>
                      <p className="text-[10px] text-[#8C7A6B]">
                        Size: {ci.size} · Qty: {ci.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-[#4A2925]">
                      ₹{" "}
                      {(ci.product.price * ci.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-[#EDE5D5] pt-4 space-y-2.5">
                <div className="flex justify-between text-xs text-[#8C7A6B]">
                  <span>Subtotal</span>
                  <span>₹ {totalCartPrice.toLocaleString("en-IN")}</span>
                </div>

                {appliedPromo && promoDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-medium">
                        Promo ({appliedPromo.code})
                      </span>
                    </div>
                    <span className="font-bold">
                      - ₹ {promoDiscount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-[#8C7A6B]">
                  <span>Shipping</span>
                  <span className="text-emerald-700 font-semibold uppercase">
                    Free
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#EDE5D5]">
                  <div>
                    <span className="font-serif text-base font-bold text-[#4A2925] block">
                      Total Payable
                    </span>
                    {promoDiscount > 0 && (
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        Total savings: ₹ {promoDiscount.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <span className="font-serif text-xl font-bold text-[#4A2925]">
                    ₹ {finalPayable.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {orderError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {orderError}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddress}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#4A2925] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#3D211E] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
              >
                {placing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  `Pay ₹ ${finalPayable.toLocaleString("en-IN")}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
