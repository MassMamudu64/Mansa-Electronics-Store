import RatingStars from './RatingStars';

const reviews = [
  {
    name: 'Amira K.',
    city: 'Minneapolis, MN',
    text: '“Ordered a Grade A 14 Pro Max — arrived in two days and looked brand new. Invoice came as a PDF. Super professional.”',
    rating: 5,
  },
  {
    name: 'Daniel O.',
    city: 'London, UK',
    text: '“The condition grading is honest. My Grade B 13 Pro had one tiny scuff — exactly as described. Great price.”',
    rating: 4.5,
  },
  {
    name: 'Priya S.',
    city: 'Toronto, CA',
    text: '“Battery health was 92% on my ‘excellent’ unit. Fast shipping and the packaging was solid.”',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="section">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 max-w-2xl">
          <span className="eyebrow">Loved by customers</span>
          <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Rated 4.8 / 5 across recent orders</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="card p-6">
              <RatingStars value={r.rating} showNumber={false} />
              <blockquote className="mt-3 text-sm text-ink-700">{r.text}</blockquote>
              <figcaption className="mt-5 text-xs text-ink-500">
                <span className="font-semibold text-ink-900">{r.name}</span> · {r.city}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
