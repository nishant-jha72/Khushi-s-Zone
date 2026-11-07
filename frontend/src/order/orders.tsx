import { useState, useEffect } from "react";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Truck,
  RotateCcw,
  ExternalLink,
  User,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { getUserOrdersApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLayout } from "../components/layout/useLayout";

interface OrderItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image?: string;
}

interface ShippingAddress {
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  phoneNumber?: string;
  country?: string;
  formatted?: string;
}

interface Order {
  id: string | number;
  orderNumber?: string;
  order_number?: string;
  createdAt?: string;
  created_at?: string;
  status: string;
  order_status?: string;
  totalAmount?: number;
  total_amount?: number;
  paymentMethod?: string;
  payment_method?: string;
  paymentStatus?: string;
  payment_status?: string;
  items?: OrderItem[];
  shippingAddress?: ShippingAddress | string;
  shipping_address?: ShippingAddress | string;
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const layout = useLayout();
  const { user, isLoading } = useAuth();

  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        fetchUserOrders();
      } else {
        setLoading(false);
      }
    }
  }, [user, isLoading]);

  const fetchUserOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getUserOrdersApi();

      if (res.success) {
        if (Array.isArray(res.currentOrders) && Array.isArray(res.pastOrders)) {
          setCurrentOrders(res.currentOrders);
          setPastOrders(res.pastOrders);
        } else if (Array.isArray(res.orders)) {
          const isCurrentStatus = (s: string) =>
            [
              "pending",
              "confirmed",
              "processing",
              "shipped",
              "out_for_delivery",
              "out for delivery",
            ].includes((s || "").toLowerCase());

          const active = res.orders.filter((o: any) =>
            isCurrentStatus(o.status || o.order_status),
          );
          const history = res.orders.filter(
            (o: any) => !isCurrentStatus(o.status || o.order_status),
          );
          setCurrentOrders(active);
          setPastOrders(history);
        } else {
          setCurrentOrders([]);
          setPastOrders([]);
        }
      } else {
        setError(res.message || "Failed to retrieve orders.");
      }
    } catch (err: any) {
      setError(
        err.message || "Something went wrong while loading your orders.",
      );
    } finally {
      setLoading(false);
    }
  };

  const displayedOrders = activeTab === "active" ? currentOrders : pastOrders;

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase().trim();

    switch (s) {
      case "pending":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Order Placed
          </span>
        );
      case "confirmed":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-full text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /> Confirmed
          </span>
        );
      case "processing":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-full text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5 text-orange-600" /> Processing
          </span>
        );
      case "shipped":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-[11px] font-bold">
            <Package className="w-3.5 h-3.5 text-blue-600" /> Shipped
          </span>
        );
      case "out_for_delivery":
      case "out for delivery":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full text-[11px] font-bold">
            <Truck className="w-3.5 h-3.5 text-indigo-600" /> Out for Delivery
          </span>
        );
      case "delivered":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered
          </span>
        );
      case "cancelled":
      case "canceled":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-800 border border-red-200 rounded-full text-[11px] font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Cancelled
          </span>
        );
      case "returned":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-[11px] font-bold">
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" /> Returned
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-full text-[11px] font-bold">
            <Package className="w-3.5 h-3.5 text-neutral-600" /> {status || "Processing"}
          </span>
        );
    }
  };

  const formatShippingAddress = (addr: any) => {
    if (!addr) return "Address not specified";
    if (typeof addr === "string") {
      try {
        const parsed = JSON.parse(addr);
        return formatShippingAddress(parsed);
      } catch {
        return addr;
      }
    }

    const name = addr.fullName || addr.full_name || addr.name || "";
    const line1 = addr.addressLine1 || addr.address_line1 || "";
    const city = addr.city || "";
    const state = addr.state || "";
    const postalCode = addr.postalCode || addr.postal_code || addr.pincode || "";

    const location = [
      line1,
      city,
      state && postalCode ? `${state} (${postalCode})` : state || postalCode,
    ]
      .filter(Boolean)
      .join(", ");

    if (name && location) {
      return `${name} — ${location}`;
    }
    return name || location || addr.formatted || "Address available";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Recent";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recent";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // If user is not logged in
  if (!isLoading && !user) {
    return (
      <div className="min-h-[80vh] bg-[#FAF7F2] py-16 px-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-[#EDE5D5] p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#4A2925]/5 flex items-center justify-center text-[#4A2925]">
            <User className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#4A2925]">
            Sign In to View Orders
          </h2>
          <p className="text-xs text-[#8C7A6B] leading-relaxed">
            Please log in to your account to review live tracking status, past
            purchase history, and order invoices.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => layout?.openAuth("login")}
              className="w-full py-3 bg-[#4A2925] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#3D211E] transition cursor-pointer"
            >
              Sign In to Your Account
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-2.5 border border-[#EDE5D5] text-[#8C7A6B] rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#FAF7F2] transition cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Tabs */}
        <div className="bg-white rounded-3xl border border-[#EDE5D5] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4A2925]/5 flex items-center justify-center text-[#4A2925]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-[#4A2925]">
                My Orders
              </h1>
              <p className="text-xs text-[#8C7A6B]">
                Track current deliveries and view your order history
              </p>
            </div>
          </div>

          <div className="flex bg-[#FAF7F2] p-1 rounded-2xl border border-[#EDE5D5] w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "active"
                  ? "bg-[#4A2925] text-white shadow-sm"
                  : "text-[#8C7A6B] hover:text-[#4A2925]"
              }`}
            >
              Active ({currentOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-[#4A2925] text-white shadow-sm"
                  : "text-[#8C7A6B] hover:text-[#4A2925]"
              }`}
            >
              History ({pastOrders.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-xs text-[#8C7A6B] gap-3 bg-white rounded-3xl border border-[#EDE5D5]">
            <Loader2 className="w-6 h-6 animate-spin text-[#4A2925]" />
            <span>Loading your orders…</span>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-red-200 p-6 text-center space-y-3 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchUserOrders}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4A2925] text-white rounded-full text-xs font-bold hover:bg-[#3D211E] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#EDE5D5] p-16 text-center space-y-3 shadow-sm">
            <ShoppingBag className="w-12 h-12 mx-auto text-[#4A2925] opacity-20" />
            <h2 className="font-serif text-lg font-bold text-[#4A2925]">
              No{" "}
              {activeTab === "active" ? "active orders" : "past order history"}{" "}
              found
            </h2>
            <p className="text-xs text-[#8C7A6B]">
              {activeTab === "active"
                ? "When you place an order, you can track its progress right here in real time."
                : "Your completed and past orders will appear here for your reference."}
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-2 px-6 py-2.5 bg-[#4A2925] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#3D211E] transition cursor-pointer"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => {
              const orderId = order.orderNumber || order.order_number || `KZ-${order.id}`;
              const total = Number(order.totalAmount ?? order.total_amount ?? 0);
              const items = order.items || [];
              const rawDate = order.createdAt || order.created_at;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-[#EDE5D5] p-6 shadow-sm space-y-4 hover:border-[#C9B8A2] transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE5D5] pb-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#4A2925] uppercase tracking-wide">
                          Order #{orderId}
                        </p>
                        <Link
                          to={`/track?orderId=${encodeURIComponent(orderId)}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C7A6B] hover:text-[#4A2925] transition"
                          title="Track delivery progress"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="hidden sm:inline">Track</span>
                        </Link>
                      </div>
                      <p className="text-xs text-[#8C7A6B]">
                        Placed on {formatDate(rawDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status || order.order_status || "Pending")}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-[#EDE5D5]">
                    {items.length === 0 ? (
                      <p className="py-3 text-xs text-[#8C7A6B] italic">
                        Order details registered
                      </p>
                    ) : (
                      items.map((item, idx) => (
                        <div key={item.id || idx} className="py-3 flex items-center gap-4">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-14 h-16 object-cover rounded-xl border border-[#EDE5D5] bg-[#FAF7F2]"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-14 h-16 rounded-xl border border-[#EDE5D5] bg-[#FAF7F2] flex items-center justify-center text-[#8C7A6B]">
                              <Package className="w-6 h-6 opacity-40" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-[#4A2925]">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-[#8C7A6B] mt-0.5">
                              {item.size ? `Size: ${item.size} · ` : ""}Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="text-xs font-bold text-[#4A2925]">
                            ₹ {(item.price * item.quantity).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Shipping and Payment Summary */}
                  <div className="pt-3 border-t border-[#EDE5D5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FAF7F2] p-4 rounded-2xl">
                    <div className="space-y-0.5 max-w-md">
                      <p className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider">
                        Shipping Address
                      </p>
                      <p className="text-xs font-medium text-[#4A2925] line-clamp-2">
                        {formatShippingAddress(order.shippingAddress || order.shipping_address)}
                      </p>
                      <p className="text-[10px] text-[#8C7A6B]">
                        Payment: <span className="font-semibold text-[#4A2925]">{order.paymentMethod || order.payment_method || "COD"}</span>
                      </p>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between w-full sm:w-auto gap-2">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider">
                          Total Amount
                        </p>
                        <p className="font-serif text-base font-bold text-[#4A2925]">
                          ₹ {total.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <Link
                        to={`/track?orderId=${encodeURIComponent(orderId)}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4A2925] text-white rounded-full text-[11px] font-bold hover:bg-[#3D211E] transition shadow-xs cursor-pointer"
                      >
                        <span>Track Order</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
