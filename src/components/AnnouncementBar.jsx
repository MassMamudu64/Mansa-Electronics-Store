export default function AnnouncementBar() {
  return (
    <div className="bg-charcoal-950 text-[12px] text-charcoal-300">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 overflow-hidden px-4 py-2">
        <span className="hidden sm:inline-flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-charcoal-400" />
          Free delivery on orders over $50
        </span>
        <span className="hidden md:inline-flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-charcoal-400" />
          Premium quality guaranteed
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-charcoal-400" />
          Secure checkout · Easy returns
        </span>
      </div>
    </div>
  );
}
