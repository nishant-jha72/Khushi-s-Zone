import React, { useState } from "react";
import {
  MapPin, Phone, User, Home, Briefcase, MoreHorizontal,
  Navigation, Loader2, CheckCircle, AlertCircle, X, Save
} from "lucide-react";
import type {
  UserAddress, CreateAddressPayload, AddressType, ReverseGeocodeResult
} from "../../services/addressApi";
import {
  getCurrentPosition,
  getGeolocationErrorMessage,
  reverseGeocodeCoordinates
} from "../../services/addressApi";

interface AddressFormProps {
  /** Pass an address to edit it; omit or null for "create" mode */
  editAddress?: UserAddress | null;
  onSave: (payload: CreateAddressPayload) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function AddressForm({ editAddress, onSave, onCancel, isSaving = false }: AddressFormProps) {
  const isEdit = Boolean(editAddress);

  // Form state
  const [fullName, setFullName] = useState(editAddress?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(editAddress?.phoneNumber || "");
  const [altPhone, setAltPhone] = useState(editAddress?.alternatePhoneNumber || "");
  const [addressLine1, setAddressLine1] = useState(editAddress?.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(editAddress?.addressLine2 || "");
  const [landmark, setLandmark] = useState(editAddress?.landmark || "");
  const [city, setCity] = useState(editAddress?.city || "");
  const [district, setDistrict] = useState(editAddress?.district || "");
  const [state, setState] = useState(editAddress?.state || "");
  const [postalCode, setPostalCode] = useState(editAddress?.postalCode || "");
  const [country, setCountry] = useState(editAddress?.country || "India");
  const [addressType, setAddressType] = useState<AddressType>(editAddress?.addressType || "Home");
  const [isDefault, setIsDefault] = useState(editAddress?.isDefault ?? false);
  const [lat, setLat] = useState<number | null>(editAddress?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(editAddress?.longitude ?? null);
  const [formattedAddress, setFormattedAddress] = useState(editAddress?.formattedAddress || "");

  // Location capture state
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"idle" | "success" | "error">("idle");
  const [locationMsg, setLocationMsg] = useState("");

  // Form error
  const [formError, setFormError] = useState("");

  // Fill form fields from reverse-geocode result (without overwriting user-typed data unless coming from GPS)
  const fillFromGeocode = (geo: ReverseGeocodeResult) => {
    if (geo.addressLine1) setAddressLine1(geo.addressLine1);
    if (geo.addressLine2) setAddressLine2(geo.addressLine2);
    if (geo.landmark) setLandmark(geo.landmark);
    if (geo.city) setCity(geo.city);
    if (geo.district) setDistrict(geo.district);
    if (geo.state) setState(geo.state);
    if (geo.postalCode) setPostalCode(geo.postalCode);
    if (geo.country) setCountry(geo.country);
    if (geo.formattedAddress) setFormattedAddress(geo.formattedAddress);
  };

  const handleUseLocation = async () => {
    setLocationLoading(true);
    setLocationStatus("idle");
    setLocationMsg("");

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      setLat(latitude);
      setLng(longitude);

      const geoRes = await reverseGeocodeCoordinates(latitude, longitude);
      if (geoRes.success && geoRes.address) {
        fillFromGeocode(geoRes.address);
        setLocationStatus("success");
        setLocationMsg("Location detected! Please verify and edit the fields below.");
      } else {
        setLocationStatus("error");
        setLocationMsg("Could not convert coordinates to an address. Please fill in manually.");
      }
    } catch (err: any) {
      setLocationStatus("error");
      if (err instanceof GeolocationPositionError || (err && typeof err.code === "number")) {
        setLocationMsg(getGeolocationErrorMessage(err as GeolocationPositionError));
      } else if (err?.message?.includes("Geocoding")) {
        setLat(null);
        setLng(null);
        setLocationMsg("Geocoding service is temporarily unavailable. Please enter your address manually.");
      } else {
        setLocationMsg("Failed to get location. Please enter your address manually.");
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim()) { setFormError("Recipient name is required"); return; }
    if (!phoneNumber.trim()) { setFormError("Phone number is required"); return; }
    if (!addressLine1.trim()) { setFormError("Address line 1 is required"); return; }
    if (!city.trim()) { setFormError("City is required"); return; }
    if (!state.trim()) { setFormError("State is required"); return; }
    if (!postalCode.trim()) { setFormError("PIN code is required"); return; }

    const payload: CreateAddressPayload = {
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim(),
      alternate_phone_number: altPhone.trim() || undefined,
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim() || undefined,
      landmark: landmark.trim() || undefined,
      city: city.trim(),
      district: district.trim() || undefined,
      state: state.trim(),
      postal_code: postalCode.trim(),
      country: country.trim() || "India",
      latitude: lat,
      longitude: lng,
      formatted_address: formattedAddress.trim() || undefined,
      address_type: addressType,
      is_default: isDefault,
    };

    await onSave(payload);
  };

  const inputClass = "w-full px-4 py-2.5 bg-white border border-[#EDE5D5] rounded-xl text-xs text-[#4A2925] placeholder-[#B5A898] focus:outline-none focus:ring-1 focus:ring-[#4A2925] focus:border-[#4A2925] transition";
  const labelClass = "block text-[11px] font-bold text-[#4A2925] uppercase tracking-wider mb-1";

  return (
    <div className="bg-[#FAF7F2] rounded-3xl border border-[#EDE5D5] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#EDE5D5] flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#4A2925]">
            {isEdit ? "Edit Address" : "Add New Address"}
          </h3>
          <p className="text-[11px] text-[#8C7A6B] mt-0.5">
            {isEdit ? "Update your saved delivery address" : "Save a delivery address to your account"}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 text-[#8C7A6B] hover:text-[#4A2925] hover:bg-[#EDE5D5] rounded-full transition"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Use My Current Location */}
        <div className="relative">
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={locationLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-[#C9B8A2] rounded-2xl text-xs font-semibold text-[#4A2925] hover:border-[#4A2925] hover:bg-[#EDE5D5]/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {locationLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Detecting your location…</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>Use My Current Location</span>
              </>
            )}
          </button>

          {locationStatus !== "idle" && (
            <div
              className={`mt-2 flex items-start gap-2 p-3 rounded-xl text-[11px] font-medium ${
                locationStatus === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {locationStatus === "success" ? (
                <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              )}
              <span>{locationMsg}</span>
            </div>
          )}
          <p className="text-center text-[10px] text-[#B5A898] mt-1.5">
            © OpenStreetMap contributors — location used only to pre-fill this form
          </p>
        </div>

        <div className="border-t border-[#EDE5D5]" />

        {/* Recipient details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Recipient Name *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-3.5 h-3.5 text-[#8C7A6B]" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name of recipient"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-3.5 h-3.5 text-[#8C7A6B]" />
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Alternate Phone <span className="font-normal normal-case text-[#B5A898]">(optional)</span></label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-3.5 h-3.5 text-[#8C7A6B]" />
              <input
                type="tel"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                placeholder="+91 98765 XXXXX"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
        </div>

        {/* Address fields */}
        <div>
          <label className={labelClass}>House No., Building, Street *</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3 w-3.5 h-3.5 text-[#8C7A6B]" />
            <input
              type="text"
              required
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="102, Lotus Apartments, Green Park Main Road"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Apartment, Area, Locality <span className="font-normal normal-case text-[#B5A898]">(optional)</span>
          </label>
          <input
            type="text"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            placeholder="Sector 12, Near Metro Station"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Landmark <span className="font-normal normal-case text-[#B5A898]">(optional)</span>
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Near SBI Bank, Behind City Mall"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>City / Town *</label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="New Delhi"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              District <span className="font-normal normal-case text-[#B5A898]">(optional)</span>
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="South Delhi"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>State *</label>
            <select
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={inputClass}
            >
              <option value="">Select state…</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>PIN / Postal Code *</label>
            <input
              type="text"
              required
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="110016"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="India"
              className={inputClass}
            />
          </div>
        </div>

        {/* Address type */}
        <div>
          <label className={labelClass}>Address Type</label>
          <div className="flex gap-3 flex-wrap">
            {(["Home", "Work", "Other"] as AddressType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAddressType(type)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold border transition-all ${
                  addressType === type
                    ? "bg-[#4A2925] text-white border-[#4A2925]"
                    : "bg-white text-[#4A2925] border-[#EDE5D5] hover:border-[#4A2925]"
                }`}
              >
                {type === "Home" && <Home className="w-3 h-3" />}
                {type === "Work" && <Briefcase className="w-3 h-3" />}
                {type === "Other" && <MoreHorizontal className="w-3 h-3" />}
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Set as default */}
        <label className="flex items-center gap-3 cursor-pointer select-none group">
          <div
            onClick={() => setIsDefault((v) => !v)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isDefault ? "bg-[#4A2925] border-[#4A2925]" : "bg-white border-[#D9CEB9] group-hover:border-[#4A2925]"
            }`}
          >
            {isDefault && <CheckCircle className="w-3 h-3 text-white" />}
          </div>
          <span className="text-xs text-[#4A2925] font-medium">Set as my default delivery address</span>
        </label>

        {/* Error */}
        {formError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-[11px] font-medium text-red-700">{formError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#4A2925] text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#3D211E] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isEdit ? "Update Address" : "Save Address"}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-[#EDE5D5] text-[#4A2925] rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#EDE5D5] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
