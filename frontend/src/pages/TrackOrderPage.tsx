import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  Package,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function TrackOrderPage() {
  const { user } = useAuth();
  const [orderId, setOrderId] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError("Please enter a valid Order ID.");
      return;
    }

    setError(null);
    setIsSearching(true);

    // Simulate reliable tracking lookup
    setTimeout(() => {
      setIsSearching(false);
      setTrackingData({
        orderNumber: orderId.toUpperCase(),
        status: "In Transit",
        carrier: "Delhivery Air Express",
        trackingNumber: `DL${Math.floor(100000000 + Math.random() * 900000000)}IN`,
        estimatedDelivery: "3-4 Business Days",
        destination: "Customer Address",
        events: [
          {
            title: "Order Placed & Confirmed",
            desc: "Payment verified and order sent to warehouse fulfillment.",
            time: "Oct 27, 2026 · 10:30 AM",
            done: true,
          },
          {
            title: "Quality Check & Handcrafted Packing",
            desc: "Garment inspected, pressed, and sealed in branded eco-packaging.",
            time: "Oct 27, 2026 · 03:45 PM",
            done: true,
          },
          {
            title: "Dispatched via Delhivery Express",
            desc: "Shipment picked up by courier and departed sorting facility.",
            time: "Oct 28, 2026 · 06:15 AM",
            done: true,
          },
          {
            title: "Out for Delivery",
            desc: "Courier executive will deliver package to your address.",
            time: "Pending",
            done: false,
          },
          {
            title: "Delivered",
            desc: "Package delivered safely into your hands.",
            time: "Pending",
            done: false,
          },
        ],
      });
    }, 600);
  };

  return (
    <div className="w-full">
      {/* Top Banner */}
      <div className="bg-[#EDE5D5] py-8 px-4 sm:px-8 border-b border-[#D9CEB9]">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] text-[#4A2925] text-[10px] font-bold tracking-widest uppercase border border-[#D9CEB9]">
            <Truck className="w-3.5 h-3.5 text-[#6E493F]" />
            <span>Order Shipment Tracker</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#4A2925] tracking-tight">
            Track Your Delivery
          </h1>

          <p className="text-xs text-[#8C7A6B] max-w-lg mx-auto leading-relaxed">
            Enter your Order ID and associated contact information to see live
            status updates, courier consignment tracking, and estimated delivery
            date.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-12 space-y-10">
        {/* Tracker Form Card */}
        <div className="bg-white p-8 rounded-2xl border border-[#EDE5D5] shadow-sm">
          <form onSubmit={handleTrack} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold tracking-wider uppercase text-[#4A2925] mb-2">
                  Order ID / Reference #
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7A6B]" />
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => {
                      setOrderId(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g. ORD-81729 or #23"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F7F2EA] border border-[#EDE5D5] rounded-xl text-xs font-semibold text-[#4A2925] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#4A2925]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wider uppercase text-[#4A2925] mb-2">
                  Email or Phone (Optional)
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Enter email or mobile number"
                  className="w-full px-4 py-2.5 bg-[#F7F2EA] border border-[#EDE5D5] rounded-xl text-xs font-semibold text-[#4A2925] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#4A2925]"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-semibold">{error}</p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#EDE5D5]">
              {user ? (
                <Link
                  to="/account?tab=orders"
                  className="text-xs text-[#6E493F] hover:text-[#4A2925] font-semibold flex items-center gap-1.5"
                >
                  <span>Or view your order history in My Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <p className="text-[11px] text-[#8C7A6B]">
                  Check your confirmation email or SMS for your Order ID.
                </p>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="w-full sm:w-auto px-8 py-3 bg-[#4A2925] hover:bg-[#3D211E] text-white text-xs font-bold tracking-widest uppercase rounded-full transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>TRACK SHIPMENT</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tracking Details Result */}
        {trackingData && (
          <div className="bg-white p-8 rounded-2xl border border-[#EDE5D5] shadow-sm space-y-8 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EDE5D5]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C7A6B]">
                  LIVE TRACKING
                </span>
                <h3 className="font-serif text-xl font-bold text-[#4A2925] mt-0.5">
                  Order #{trackingData.orderNumber}
                </h3>
                <p className="text-xs text-[#8C7A6B] mt-1">
                  Courier:{" "}
                  <strong className="text-[#4A2925]">
                    {trackingData.carrier}
                  </strong>{" "}
                  · AWB:{" "}
                  <span className="font-mono">{trackingData.trackingNumber}</span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider rounded-full">
                  {trackingData.status}
                </span>
                <p className="text-xs text-[#8C7A6B] mt-1.5">
                  Est. Delivery:{" "}
                  <span className="font-bold text-[#4A2925]">
                    {trackingData.estimatedDelivery}
                  </span>
                </p>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A2925]">
                Shipment Milestones
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EDE5D5]">
                {trackingData.events.map((ev: any, idx: number) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div
                      className={`absolute -left-6 mt-1 w-5 h-5 rounded-full flex items-center justify-center ${
                        ev.done
                          ? "bg-[#4A2925] text-white"
                          : "bg-[#EDE5D5] text-[#8C7A6B]"
                      }`}
                    >
                      {ev.done ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p
                          className={`text-xs font-bold ${
                            ev.done ? "text-[#4A2925]" : "text-[#8C7A6B]"
                          }`}
                        >
                          {ev.title}
                        </p>
                        <span className="text-[10px] text-[#8C7A6B]">
                          {ev.time}
                        </span>
                      </div>
                      <p className="text-xs text-[#8C7A6B] leading-relaxed">
                        {ev.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Guarantee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-5 bg-white rounded-xl border border-[#EDE5D5] text-center space-y-2">
            <Truck className="w-6 h-6 text-[#4A2925] mx-auto" />
            <h5 className="font-serif text-sm font-bold text-[#4A2925]">
              Free Express Shipping
            </h5>
            <p className="text-[11px] text-[#8C7A6B]">
              All prepaid orders across India are shipped via priority air
              couriers at zero extra cost.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-[#EDE5D5] text-center space-y-2">
            <ShieldCheck className="w-6 h-6 text-[#4A2925] mx-auto" />
            <h5 className="font-serif text-sm font-bold text-[#4A2925]">
              Real-Time SMS & Email
            </h5>
            <p className="text-[11px] text-[#8C7A6B]">
              You will receive live notification updates every step of the way
              with courier contact details.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-[#EDE5D5] text-center space-y-2">
            <MapPin className="w-6 h-6 text-[#4A2925] mx-auto" />
            <h5 className="font-serif text-sm font-bold text-[#4A2925]">
              Pan-India Coverage
            </h5>
            <p className="text-[11px] text-[#8C7A6B]">
              We deliver to over 19,000+ pin codes safely with verified OTP on
              delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
