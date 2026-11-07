import { useState, useEffect } from "react";
import {
  ShoppingBag,
  MapPin,
  CheckCircle,
  Loader2,
  AlertCircle,
  Plus,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // Assuming React Router
import { useAuth } from "../../context/AuthContext";
import { getAddresses, createAddress } from "../../services/addressApi";
import type {
  UserAddress,
  CreateAddressPayload,
} from "../../services/addressApi";
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

  useEffect(() => {
    // Redirect back to cart if cart is empty
    if (cartItems.length === 0 && !orderSuccess) {
      navigate("/cart");
      return;
    }
    loadAddresses();
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
      });
      setOrderSuccess(true);
      setTimeout(() => {
        navigate("/orders"); // Or order confirmation page
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
        {/* Top Navigation / Header */}
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-[#EDE5D5] shadow-sm">
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center gap-2 text-xs font-bold text-[#4A2925] hover:text-[#8C7A6B] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </button>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#4A2925]" />
            <h1 className="font-serif text-lg font-bold text-[#4A2925]">
              Secure Checkout
            </h1>
          </div>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Address, Payment, & Future Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Delivery Address */}
            <div className="bg-white rounded-3xl border border-[#EDE5D5] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDE5D5] pb-3">
                <p className="text-xs font-bold text-[#4A2925] uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#8C7A6B]" /> Delivery Address
                </p>
              </div>

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
                    <div className="py-8 text-center space-y-2 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#EDE5D5]">
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
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#C9B8A2] rounded-2xl text-xs font-semibold text-[#4A2925] hover:border-[#4A2925] hover:bg-[#EDE5D5]/30 transition-all mt-3"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add New Address
                  </button>
                </>
              )}
            </div>

            {/* Section 2: Payment Method */}
            <div className="bg-white rounded-3xl border border-[#EDE5D5] p-6 shadow-sm space-y-4">
              <div className="border-b border-[#EDE5D5] pb-3">
                <p className="text-xs font-bold text-[#4A2925] uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#8C7A6B]" /> Payment
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

            {/* Note for Future Expansion */}
            <div className="p-4 bg-[#F7F2EA] rounded-2xl border border-[#EDE5D5] text-xs text-[#8C7A6B]">
              💡 **Future Ready:** You can easily append new modular components
              here (such as delivery instructions, gift wrapping options, or
              discount code inputs) without crowding the interface.
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
                      ₹
                      {(ci.product.price * ci.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-[#EDE5D5] pt-4 space-y-2">
                <div className="flex justify-between text-xs text-[#8C7A6B]">
                  <span>Subtotal</span>
                  <span>₹ {totalCartPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs text-[#8C7A6B]">
                  <span>Shipping</span>
                  <span className="text-emerald-700 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#EDE5D5]">
                  <span className="font-serif text-base font-bold text-[#4A2925]">
                    Total
                  </span>
                  <span className="font-serif text-xl font-bold text-[#4A2925]">
                    ₹ {totalCartPrice.toLocaleString("en-IN")}
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
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#4A2925] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#3D211E] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {placing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
