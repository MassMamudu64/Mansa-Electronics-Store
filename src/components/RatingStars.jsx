// Decorative rating stars. The value is a number 0..5. Not stored in the DB —
// this is a UX signal; wire it to real reviews later.
export default function RatingStars({ value = 4.7, size = 14, showNumber = true, count }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="inline-flex items-center gap-1 text-gold-500">
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < full;
        const isHalf = !filled && i === full && half;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={filled || isHalf ? '' : 'text-ink-200'}>
            {isHalf ? (
              <>
                <defs>
                  <linearGradient id={`h${i}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="#C9CDD6" />
                  </linearGradient>
                </defs>
                <path fill={`url(#h${i})`} d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
              </>
            ) : (
              <path fill="currentColor" d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
            )}
          </svg>
        );
      })}
      {showNumber && (
        <span className="ml-1 text-xs text-ink-500">
          {value.toFixed(1)}{count ? ` (${count})` : ''}
        </span>
      )}
    </div>
  );
}
