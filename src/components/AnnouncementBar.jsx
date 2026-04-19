// Thin top bar used by major retailers (Apple, Back Market, Best Buy) for promos/trust.
export default function AnnouncementBar() {
  return (
    <div className="bg-ink-900 text-[12px] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-2 overflow-hidden">
        <span className="hidden sm:inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          Free shipping on orders over $99
        </span>
        <span className="hidden md:inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          12-month limited warranty
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          30-day returns · Hand-tested devices
        </span>
      </div>
    </div>
  );
}
