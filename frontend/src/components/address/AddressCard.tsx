import { MapPin, Phone, Home, Briefcase, MoreHorizontal, Star, Pencil, Trash2, CheckCircle, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AddressType, UserAddress } from "../../services/addressApi";

interface AddressCardProps {
  address: UserAddress;
  onEdit: (address: UserAddress) => void;
  onDelete: (address: UserAddress) => void;
  onSetDefault: (address: UserAddress) => void;
  isSettingDefault?: boolean;
  isDeleting?: boolean;
  /** If true, show a "Select" button (used during checkout) */
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: (address: UserAddress) => void;
}

const TYPE_ICON: Record<AddressType, LucideIcon> = {
  Home,
  Work: Briefcase,
  Other: MoreHorizontal,
};

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isSettingDefault = false,
  isDeleting = false,
  selectable = false,
  isSelected = false,
  onSelect,
}: AddressCardProps) {
  const TypeIcon = TYPE_ICON[address.addressType] ?? MapPin;
  const busy = isSettingDefault || isDeleting;

  return (
    <div
      className={`relative rounded-2xl border p-5 transition-all ${
        isSelected
          ? "border-[#4A2925] bg-[#4A2925]/5 shadow-md"
          : address.isDefault
          ? "border-[#C9B8A2] bg-[#FAF7F2] shadow-sm"
          : "border-[#EDE5D5] bg-white hover:border-[#C9B8A2] hover:shadow-sm"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {/* Address type badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
              address.addressType === "Home"
                ? "bg-emerald-100 text-emerald-800"
                : address.addressType === "Work"
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            <TypeIcon className="w-2.5 h-2.5" />
            {address.addressType}
          </span>

          {address.isDefault && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4A2925] text-white">
              <Star className="w-2.5 h-2.5 fill-white" />
              Default
            </span>
          )}
        </div>

        {!selectable && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onEdit(address)}
              disabled={busy}
              className="p-1.5 rounded-full text-[#8C7A6B] hover:text-[#4A2925] hover:bg-[#EDE5D5] transition-all disabled:opacity-40"
              title="Edit address"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(address)}
              disabled={busy}
              className="p-1.5 rounded-full text-[#8C7A6B] hover:text-red-700 hover:bg-red-50 transition-all disabled:opacity-40"
              title="Delete address"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Address details */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-[#4A2925]">{address.fullName}</p>

        <div className="flex items-center gap-1.5 text-[11px] text-[#8C7A6B]">
          <Phone className="w-3 h-3 shrink-0" />
          <span>{address.phoneNumber}</span>
          {address.alternatePhoneNumber && (
            <>
              <span className="text-[#D9CEB9]">•</span>
              <span>{address.alternatePhoneNumber}</span>
            </>
          )}
        </div>

        <div className="flex items-start gap-1.5 text-[11px] text-[#8C7A6B]">
          <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="leading-relaxed">
            {address.addressLine1}
            {address.addressLine2 && `, ${address.addressLine2}`}
            {address.landmark && `, Near ${address.landmark}`}
            <br />
            {address.city}
            {address.district && `, ${address.district}`}
            {`, ${address.state} – ${address.postalCode}`}
            <br />
            {address.country}
          </span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {selectable && (
          <button
            onClick={() => onSelect?.(address)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all ${
              isSelected
                ? "bg-[#4A2925] text-white"
                : "border border-[#4A2925] text-[#4A2925] hover:bg-[#4A2925] hover:text-white"
            }`}
          >
            {isSelected && <CheckCircle className="w-3 h-3" />}
            {isSelected ? "Selected" : "Deliver Here"}
          </button>
        )}

        {!address.isDefault && !selectable && (
          <button
            onClick={() => onSetDefault(address)}
            disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold border border-[#EDE5D5] text-[#4A2925] hover:border-[#4A2925] hover:bg-[#EDE5D5]/60 transition-all disabled:opacity-40"
          >
            {isSettingDefault ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Setting…</span>
              </>
            ) : (
              <>
                <Star className="w-3 h-3" />
                <span>Set as Default</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
