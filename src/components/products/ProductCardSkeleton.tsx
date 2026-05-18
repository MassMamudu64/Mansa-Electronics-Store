export default function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-product">
      <div className="aspect-square animate-pulse bg-gradient-to-br from-charcoal-50 via-charcoal-100/60 to-charcoal-50" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-2.5 w-1/4 animate-pulse rounded-full bg-charcoal-100" />
        <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-charcoal-100" />
        <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-charcoal-100" />
        <div className="mt-2 flex gap-1.5">
          <div className="h-4 w-12 animate-pulse rounded-md bg-charcoal-100" />
          <div className="h-4 w-14 animate-pulse rounded-md bg-charcoal-100" />
        </div>
        <div className="mt-3 h-5 w-1/3 animate-pulse rounded-full bg-charcoal-100" />
      </div>
    </div>
  );
}
