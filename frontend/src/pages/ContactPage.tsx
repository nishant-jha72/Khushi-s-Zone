import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  HelpCircle,
  Truck,
  RotateCcw,
  Ruler,
  ShieldCheck,
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Order Status");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setName("");
      setEmail("");
      setMessage("");
      setSubmitted(false);
    }, 4000);
  };

  return (
    <div className="w-full">
      {/* Top Banner */}
      <div className="bg-[#EDE5D5] py-8 px-4 sm:px-8 border-b border-[#D9CEB9]">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] text-[#4A2925] text-[10px] font-bold tracking-widest uppercase border border-[#D9CEB9]">
            <HelpCircle className="w-3.5 h-3.5 text-[#6E493F]" />
            <span>Customer Concierge</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#4A2925] tracking-tight">
            Contact & Support
          </h1>

          <p className="text-xs text-[#8C7A6B] max-w-lg mx-auto leading-relaxed">
            Have questions regarding sizes, deliveries, custom orders, or styling
            advice? Our team is always ready to guide you.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 space-y-16">
        {/* Contact Info & Message Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Contact Channels (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE5D5] shadow-xs space-y-6">
              <h2 className="font-serif text-xl font-bold text-[#4A2925]">
                Get In Touch
              </h2>

              <p className="text-xs text-[#8C7A6B] leading-relaxed">
                We take immense pride in crafting pieces that bring you
                happiness. Please reach out to us with any inquiry.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-[#F7F2EA] text-[#4A2925] shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A2925]">
                      Email Support
                    </h3>
                    <a
                      href="mailto:support@khushizone.com"
                      className="text-xs text-[#6E493F] hover:text-[#4A2925] font-semibold"
                    >
                      support@khushizone.com
                    </a>
                    <p className="text-[10px] text-[#8C7A6B]">
                      Response within 2-4 business hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-[#F7F2EA] text-[#4A2925] shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A2925]">
                      Phone & WhatsApp
                    </h3>
                    <a
                      href="tel:+919876543210"
                      className="text-xs text-[#6E493F] hover:text-[#4A2925] font-semibold"
                    >
                      +91 98765 43210
                    </a>
                    <p className="text-[10px] text-[#8C7A6B]">
                      Mon – Sat: 10:00 AM – 7:00 PM IST
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-[#F7F2EA] text-[#4A2925] shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A2925]">
                      Design Studio & Atelier
                    </h3>
                    <p className="text-xs text-[#6E493F] leading-relaxed">
                      Khushi's Zone, Awadh Groups,
                      <br />
                      Lucknow, Uttar Pradesh, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-[#F7F2EA] text-[#4A2925] shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A2925]">
                      Business Hours
                    </h3>
                    <p className="text-xs text-[#6E493F]">
                      Monday to Saturday: 10:00 AM – 7:00 PM IST
                    </p>
                    <p className="text-[10px] text-[#8C7A6B]">
                      Sunday: Closed (Orders dispatched next business day)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Send Message Form (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE5D5] shadow-xs space-y-6">
              <h2 className="font-serif text-xl font-bold text-[#4A2925]">
                Send Us a Message
              </h2>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-2 text-emerald-800">
                  <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                  <h3 className="font-serif font-bold text-base">
                    Message Received!
                  </h3>
                  <p className="text-xs">
                    Thank you for reaching out. One of our stylists will get
                    back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4A2925] mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Khushi Sharma"
                        className="w-full px-4 py-2.5 bg-[#F7F2EA] border border-[#EDE5D5] rounded-xl text-xs font-semibold text-[#4A2925] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#4A2925]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#4A2925] mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. name@example.com"
                        className="w-full px-4 py-2.5 bg-[#F7F2EA] border border-[#EDE5D5] rounded-xl text-xs font-semibold text-[#4A2925] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#4A2925]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4A2925] mb-1.5">
                      Inquiry Topic
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#F7F2EA] border border-[#EDE5D5] rounded-xl text-xs font-semibold text-[#4A2925] focus:outline-none focus:ring-1 focus:ring-[#4A2925]"
                    >
                      <option value="Order Status">Order Status & Delivery</option>
                      <option value="Returns & Exchanges">Returns & Exchanges</option>
                      <option value="Sizing & Fit">Sizing & Styling Advice</option>
                      <option value="Payment & Billing">Payment or Billing Issue</option>
                      <option value="General Feedback">Feedback or Custom Request</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4A2925] mb-1.5">
                      How Can We Help You? *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please share details about your inquiry..."
                      className="w-full px-4 py-2.5 bg-[#F7F2EA] border border-[#EDE5D5] rounded-xl text-xs font-semibold text-[#4A2925] placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-[#4A2925]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#4A2925] hover:bg-[#3D211E] text-white text-xs font-bold tracking-widest uppercase rounded-full transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>SEND MESSAGE</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Informational Policy Sections matching Footer anchors */}
        <div className="space-y-12 pt-6 border-t border-[#EDE5D5]">
          {/* Shipping Info Anchor */}
          <div id="shipping" className="bg-white p-8 rounded-2xl border border-[#EDE5D5] shadow-xs space-y-4 scroll-mt-28">
            <div className="flex items-center space-x-3 text-[#4A2925]">
              <Truck className="w-5 h-5 text-[#6E493F]" />
              <h3 className="font-serif text-lg font-bold">
                Shipping & Delivery Policy
              </h3>
            </div>
            <p className="text-xs text-[#8C7A6B] leading-relaxed">
              We offer free express delivery across India on all prepaid orders.
              Orders are dispatched within 24 business hours from our Lucknow
              atelier. Delivery typically takes 3 to 5 business days depending
              on your location. Tracking details are sent automatically to your
              registered email and mobile number upon courier dispatch.
            </p>
          </div>

          {/* Returns & Exchanges Anchor */}
          <div id="returns" className="bg-white p-8 rounded-2xl border border-[#EDE5D5] shadow-xs space-y-4 scroll-mt-28">
            <div className="flex items-center space-x-3 text-[#4A2925]">
              <RotateCcw className="w-5 h-5 text-[#6E493F]" />
              <h3 className="font-serif text-lg font-bold">
                Returns & Exchanges
              </h3>
            </div>
            <p className="text-xs text-[#8C7A6B] leading-relaxed">
              We accept returns or size exchanges within 7 days of delivery.
              The product must be unused, unwashed, and with all original tags
              and packaging intact. Once your return request is approved, our
              courier partner will arrange a hassle-free pickup from your
              doorstep.
            </p>
          </div>

          {/* Size Guide Anchor */}
          <div id="size-guide" className="bg-white p-8 rounded-2xl border border-[#EDE5D5] shadow-xs space-y-4 scroll-mt-28">
            <div className="flex items-center space-x-3 text-[#4A2925]">
              <Ruler className="w-5 h-5 text-[#6E493F]" />
              <h3 className="font-serif text-lg font-bold">
                Standard Size Guide (Inches & CM)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#EDE5D5] text-[#4A2925]">
                    <th className="py-2.5 px-3 font-bold">Size</th>
                    <th className="py-2.5 px-3 font-bold">Bust (in)</th>
                    <th className="py-2.5 px-3 font-bold">Waist (in)</th>
                    <th className="py-2.5 px-3 font-bold">Hip (in)</th>
                    <th className="py-2.5 px-3 font-bold">India / UK Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE5D5]/60 text-[#6E493F]">
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#4A2925]">XS</td>
                    <td className="py-2 px-3">32 - 33"</td>
                    <td className="py-2 px-3">25 - 26"</td>
                    <td className="py-2 px-3">35 - 36"</td>
                    <td className="py-2 px-3">UK 6</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#4A2925]">S</td>
                    <td className="py-2 px-3">34 - 35"</td>
                    <td className="py-2 px-3">27 - 28"</td>
                    <td className="py-2 px-3">37 - 38"</td>
                    <td className="py-2 px-3">UK 8</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#4A2925]">M</td>
                    <td className="py-2 px-3">36 - 37"</td>
                    <td className="py-2 px-3">29 - 30"</td>
                    <td className="py-2 px-3">39 - 40"</td>
                    <td className="py-2 px-3">UK 10</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#4A2925]">L</td>
                    <td className="py-2 px-3">38 - 40"</td>
                    <td className="py-2 px-3">31 - 33"</td>
                    <td className="py-2 px-3">41 - 43"</td>
                    <td className="py-2 px-3">UK 12</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#4A2925]">XL</td>
                    <td className="py-2 px-3">41 - 43"</td>
                    <td className="py-2 px-3">34 - 36"</td>
                    <td className="py-2 px-3">44 - 46"</td>
                    <td className="py-2 px-3">UK 14</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-[#4A2925]">XXL</td>
                    <td className="py-2 px-3">44 - 46"</td>
                    <td className="py-2 px-3">37 - 39"</td>
                    <td className="py-2 px-3">47 - 49"</td>
                    <td className="py-2 px-3">UK 16</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Craftsmanship Anchor */}
          <div id="craftsmanship" className="bg-white p-8 rounded-2xl border border-[#EDE5D5] shadow-xs space-y-4 scroll-mt-28">
            <div className="flex items-center space-x-3 text-[#4A2925]">
              <ShieldCheck className="w-5 h-5 text-[#6E493F]" />
              <h3 className="font-serif text-lg font-bold">
                Artisanal Craftsmanship & Sourcing
              </h3>
            </div>
            <p className="text-xs text-[#8C7A6B] leading-relaxed">
              Every Khushi's Zone garment is crafted using premium, skin-friendly
              fabrics sourced ethically from authentic weavers and master
              tailors across India. We believe in slow, sustainable luxury that
              looks breathtaking and lasts for years to come.
            </p>
          </div>

          {/* Privacy & Terms Anchors */}
          <div id="privacy" className="bg-white p-8 rounded-2xl border border-[#EDE5D5] shadow-xs space-y-4 scroll-mt-28">
            <h3 className="font-serif text-lg font-bold text-[#4A2925]">
              Privacy Policy
            </h3>
            <p className="text-xs text-[#8C7A6B] leading-relaxed">
              Your personal information, delivery addresses, and payment data are
              always protected using 256-bit encryption. We never sell or share
              your data with unauthorized third parties.
            </p>
          </div>

          <div id="terms" className="bg-white p-8 rounded-2xl border border-[#EDE5D5] shadow-xs space-y-4 scroll-mt-28">
            <h3 className="font-serif text-lg font-bold text-[#4A2925]">
              Terms of Service
            </h3>
            <p className="text-xs text-[#8C7A6B] leading-relaxed">
              By accessing Khushi's Zone, you agree to our standard shopping
              terms, promotional guidelines, and intellectual property
              conditions. All orders are subject to acceptance and availability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
