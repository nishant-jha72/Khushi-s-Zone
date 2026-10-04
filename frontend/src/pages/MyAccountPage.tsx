import React, { useState, useEffect } from "react";
import { User, Package, CreditCard, Heart, MapPin, Phone, Mail, Save, CheckCircle, ArrowLeft, ShieldCheck, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getOrdersApi } from "../services/api";

interface MyAccountPageProps {
  onBackToHome: () => void;
  defaultTab?: string;
}

export default function MyAccountPage({ onBackToHome, defaultTab = "profile" }: MyAccountPageProps) {
  const { user, updateProfile, logout, wishlistedProducts, toggleWishlist } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Form states for profile editing
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [city, setCity] = useState(user?.city || "");
  const [state, setState] = useState(user?.state || "");
  const [pincode, setPincode] = useState(user?.pincode || "");

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<string>("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setState(user.state || "");
      setPincode(user.pincode || "");
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "orders" || activeTab === "payments") {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await getOrdersApi();
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error("Failed to fetch past orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    try {
      const res = await updateProfile({ name, phone, address, city, state, pincode });
      if (res.success) {
        setProfileMessage("Account details saved successfully!");
        setTimeout(() => setProfileMessage(""), 3000);
      }
    } catch (err: any) {
      setProfileMessage("Failed to save account details.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F7F2EA] flex items-center justify-center p-6 text-center">
        <div className="bg-[#FAF7F2] p-8 rounded-3xl border border-[#EDE5D5] shadow-xl max-w-md w-full space-y-4">
          <User className="w-12 h-12 mx-auto text-[#4A2925] opacity-50" />
          <h2 className="font-serif text-2xl font-bold text-[#4A2925]">Sign In Required</h2>
          <p className="text-xs text-[#8C7A6B]">Please sign in to view your account details, past orders, and saved addresses.</p>
          <button
            onClick={onBackToHome}
            className="w-full py-2.5 bg-[#4A2925] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#3D211E]"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#4A2925] font-sans antialiased py-8 px-4 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FAF7F2] p-6 rounded-3xl border border-[#EDE5D5] shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToHome}
              className="p-2 text-[#4A2925] hover:bg-[#EDE5D5] rounded-full transition-colors"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-[#4A2925] text-[#F7F2EA] flex items-center justify-center font-bold text-lg shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-serif text-2xl font-bold text-[#4A2925]">{user.name}</h1>
                  {user.isVerified && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8C7A6B]">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={logout}
              className="px-4 py-2 border border-[#4A2925] text-[#4A2925] hover:bg-[#4A2925] hover:text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Account Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 bg-[#FAF7F2] rounded-3xl p-4 border border-[#EDE5D5] shadow-sm space-y-2 h-fit">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                activeTab === "profile"
                  ? "bg-[#4A2925] text-white shadow-sm"
                  : "text-[#4A2925] hover:bg-[#EDE5D5]/70"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Account Info</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                activeTab === "orders"
                  ? "bg-[#4A2925] text-white shadow-sm"
                  : "text-[#4A2925] hover:bg-[#EDE5D5]/70"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Past Orders</span>
            </button>

            <button
              onClick={() => setActiveTab("payments")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                activeTab === "payments"
                  ? "bg-[#4A2925] text-white shadow-sm"
                  : "text-[#4A2925] hover:bg-[#EDE5D5]/70"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment Details</span>
            </button>

            <button
              onClick={() => setActiveTab("wishlist")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                activeTab === "wishlist"
                  ? "bg-[#4A2925] text-white shadow-sm"
                  : "text-[#4A2925] hover:bg-[#EDE5D5]/70"
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Wishlist</span>
            </button>
          </div>

          {/* Main Tab Content */}
          <div className="lg:col-span-3">
            {/* TAB 1: ACCOUNT INFO / PROFILE */}
            {activeTab === "profile" && (
              <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#EDE5D5] shadow-sm space-y-6">
                <div className="border-b border-[#EDE5D5] pb-4">
                  <h2 className="font-serif text-xl font-bold text-[#4A2925]">Personal & Shipping Details</h2>
                  <p className="text-xs text-[#8C7A6B]">Manage your profile details and default shipping destination</p>
                </div>

                {profileMessage && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{profileMessage}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A2925] uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7A6B]" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDE5D5] rounded-xl text-xs focus:ring-1 focus:ring-[#4A2925] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4A2925] uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7A6B]" />
                        <input
                          type="email"
                          disabled
                          value={user.email}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#EDE5D5]/50 border border-[#EDE5D5] rounded-xl text-xs text-[#8C7A6B] cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4A2925] uppercase tracking-wider mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7A6B]" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDE5D5] rounded-xl text-xs focus:ring-1 focus:ring-[#4A2925] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4A2925] uppercase tracking-wider mb-1">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="110016"
                        className="w-full px-4 py-2.5 bg-white border border-[#EDE5D5] rounded-xl text-xs focus:ring-1 focus:ring-[#4A2925] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A2925] uppercase tracking-wider mb-1">
                      Shipping Street Address
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7A6B]" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="102 Lotus Avenue, Green Park"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDE5D5] rounded-xl text-xs focus:ring-1 focus:ring-[#4A2925] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A2925] uppercase tracking-wider mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="New Delhi"
                        className="w-full px-4 py-2.5 bg-white border border-[#EDE5D5] rounded-xl text-xs focus:ring-1 focus:ring-[#4A2925] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4A2925] uppercase tracking-wider mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Delhi"
                        className="w-full px-4 py-2.5 bg-white border border-[#EDE5D5] rounded-xl text-xs focus:ring-1 focus:ring-[#4A2925] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-3 bg-[#4A2925] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#3D211E] transition-all flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingProfile ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: PAST ORDERS */}
            {activeTab === "orders" && (
              <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#EDE5D5] shadow-sm space-y-6">
                <div className="border-b border-[#EDE5D5] pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#4A2925]">Your Past Orders</h2>
                    <p className="text-xs text-[#8C7A6B]">View order history, status tracking, and purchased items</p>
                  </div>
                  <span className="text-xs font-bold bg-[#EDE5D5] px-3 py-1 rounded-full text-[#4A2925]">
                    {orders.length} Orders
                  </span>
                </div>

                {loadingOrders ? (
                  <div className="py-12 text-center text-xs text-[#8C7A6B]">
                    Loading your orders from database...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Package className="w-12 h-12 mx-auto text-[#4A2925] opacity-30" />
                    <p className="text-sm font-semibold text-[#4A2925]">No past orders found</p>
                    <p className="text-xs text-[#8C7A6B]">Start exploring our women's wear collection and place your first order!</p>
                    <button
                      onClick={onBackToHome}
                      className="mt-4 px-6 py-2.5 bg-[#4A2925] text-white rounded-full text-xs font-bold uppercase tracking-wider"
                    >
                      Explore Collection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-[#EDE5D5] p-5 shadow-xs hover:border-[#D9CEB9] transition-all space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between border-b border-[#EDE5D5] pb-3 text-xs gap-2">
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#4A2925] text-sm">{order.orderNumber}</span>
                            <div className="flex items-center space-x-2 text-[10px] text-[#8C7A6B]">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                order.status === "Delivered"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {order.status}
                            </span>
                            <span className="font-bold text-[#4A2925] text-sm">
                              ₹ {order.totalAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {/* Order Items List */}
                        <div className="divide-y divide-[#EDE5D5]">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="py-3 flex items-center space-x-4">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-14 h-16 object-cover rounded-lg border border-[#EDE5D5]"
                              />
                              <div className="flex-1 text-left">
                                <h4 className="font-serif text-xs font-semibold text-[#4A2925]">{item.name}</h4>
                                <p className="text-[10px] text-[#8C7A6B]">
                                  Size: {item.size} • Qty: {item.quantity}
                                </p>
                                <p className="text-xs font-bold text-[#4A2925] mt-0.5">
                                  ₹ {item.price.toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-[#FAF7F2] p-3 rounded-xl text-[11px] text-[#8C7A6B] flex items-center justify-between">
                          <span>Payment Method: <strong>{order.paymentMethod}</strong> ({order.paymentStatus})</span>
                          <span className="truncate max-w-xs">Ship to: {order.shippingAddress}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PAYMENT DETAILS — from order history */}
            {activeTab === "payments" && (
              <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#EDE5D5] shadow-sm space-y-6">
                <div className="border-b border-[#EDE5D5] pb-4">
                  <h2 className="font-serif text-xl font-bold text-[#4A2925]">Payment Details</h2>
                  <p className="text-xs text-[#8C7A6B]">Payment methods and status from your past orders</p>
                </div>

                {loadingOrders ? (
                  <div className="py-12 text-center text-xs text-[#8C7A6B]">Loading payment history...</div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <CreditCard className="w-10 h-10 mx-auto text-[#4A2925] opacity-30" />
                    <p className="text-sm font-semibold text-[#4A2925]">No payment history yet</p>
                    <p className="text-xs text-[#8C7A6B]">Payments will appear here after you place an order.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white p-4 rounded-2xl border border-[#EDE5D5] flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#4A2925]">{order.orderNumber}</p>
                          <p className="text-[10px] text-[#8C7A6B]">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs font-semibold text-[#4A2925]">{order.paymentMethod}</p>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              order.paymentStatus === "Paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                        <p className="w-full sm:w-auto text-sm font-bold text-[#4A2925]">
                          ₹ {Number(order.totalAmount).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-[#EDE5D5]/50 rounded-2xl border border-[#D9CEB9] text-xs text-[#4A2925] flex items-center space-x-3">
                  <ShieldCheck className="w-5 h-5 text-[#4A2925] shrink-0" />
                  <span>All payment transactions are encrypted with 256-bit bank-grade SSL security.</span>
                </div>
              </div>
            )}

            {/* TAB 4: WISHLIST */}
            {activeTab === "wishlist" && (
              <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#EDE5D5] shadow-sm space-y-6">
                <div className="border-b border-[#EDE5D5] pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#4A2925]">Your Wishlist</h2>
                    <p className="text-xs text-[#8C7A6B]">Items saved from your account wishlist</p>
                  </div>
                  <span className="text-xs font-bold bg-[#EDE5D5] px-3 py-1 rounded-full text-[#4A2925]">
                    {wishlistedProducts.length} Items
                  </span>
                </div>

                {wishlistedProducts.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Heart className="w-12 h-12 mx-auto text-[#4A2925] opacity-30" />
                    <p className="text-sm font-semibold text-[#4A2925]">Wishlist is empty</p>
                    <button
                      onClick={onBackToHome}
                      className="mt-2 px-6 py-2.5 bg-[#4A2925] text-white rounded-full text-xs font-bold uppercase tracking-wider"
                    >
                      Browse Collection
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#EDE5D5]">
                    {wishlistedProducts.map((product) => (
                      <div key={product.id} className="py-4 flex items-center space-x-4">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-14 h-16 object-cover rounded-lg border border-[#EDE5D5]"
                        />
                        <div className="flex-1 text-left">
                          <h4 className="font-serif text-xs font-semibold text-[#4A2925]">{product.name}</h4>
                          <p className="text-xs font-bold text-[#4A2925] mt-0.5">
                            ₹ {product.price.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleWishlist(product.itemId || product.id)}
                          className="text-[10px] text-red-700 hover:underline font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
