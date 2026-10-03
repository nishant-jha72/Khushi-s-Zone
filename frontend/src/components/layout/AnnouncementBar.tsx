interface AnnouncementBarProps {
  message?: string;
}

export default function AnnouncementBar({
  message = "COMPLIMENTARY EXPRESS SHIPPING ON ORDERS OVER ₹1000",
}: AnnouncementBarProps) {
  return (
    <div className="w-full bg-[#4A2925] text-[#F7F2EA] text-[11px] font-medium tracking-[0.18em] py-2.5 px-4 text-center uppercase border-b border-[#3D211E] select-none">
      <span>{message}</span>
    </div>
  );
}
