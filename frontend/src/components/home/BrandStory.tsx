export default function BrandStory() {
  return (
    <section className="w-full bg-[#EDE5D5]/40 py-20 px-6 sm:px-10 lg:px-16 border-t border-[#EDE5D5]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* Left Editorial Image */}
        <div className="lg:col-span-5 order-2 lg:order-1">
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-md border border-[#EDE5D5]">
            <img
              src="/images/brand_story.jpg"
              alt="Khushi's Zone Brand Story"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-7 order-1 lg:order-2 space-y-6 text-left">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#8C7A6B]">
            OUR PHILOSOPHY
          </span>

          <h2 className="font-serif text-3xl sm:text-4xl text-[#4A2925] leading-tight">
            Crafting clothing that feels like pure happiness.
          </h2>

          <div className="space-y-4 text-xs sm:text-sm text-[#6E493F] font-light leading-relaxed">
            <p>
              At Khushi's Zone, every seam, fabric, and silhouette is designed with intention. We believe that everyday dressing should bring a sense of delight and effortless grace to your life.
            </p>
            <p>
              Drawing inspiration from classic Indian handcrafts and contemporary relaxed silhouettes, our collections celebrate modern femininity—designed to be cherished, lived in, and loved.
            </p>
          </div>

          <div className="pt-2">
            <p className="font-['Great_Vibes',cursive] text-3xl text-[#4A2925]">
              "Your Points of Happiness"
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
