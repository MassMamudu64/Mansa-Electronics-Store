const grades = [
  {
    grade: 'A',
    label: 'Excellent',
    tone: 'badge-green',
    points: ['Minimal to no visible wear', 'Screen free of marks', 'Battery health ≥ 90%'],
  },
  {
    grade: 'B',
    label: 'Very Good',
    tone: 'badge-amber',
    points: ['Light signs of use', 'Tiny scratches possible', 'Battery health ≥ 85%'],
  },
  {
    grade: 'C',
    label: 'Good',
    tone: 'badge-rose',
    points: ['Visible wear, fully functional', 'Small dings may be present', 'Battery health ≥ 80%'],
  },
];

export default function ConditionGuide() {
  return (
    <section id="conditions" className="section">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 max-w-2xl">
          <span className="eyebrow">How we grade</span>
          <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Every phone, honestly graded.</h2>
          <p className="mt-3 text-ink-500">
            We don't hide blemishes — we tell you exactly what you're buying. Each device
            passes a 30+ point inspection before it gets one of three grades.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {grades.map((g) => (
            <div key={g.grade} className="card-elev flex flex-col gap-3 p-6">
              <div className="flex items-center gap-3">
                <span className={`badge ${g.tone} text-base px-3 py-1`}>Grade {g.grade}</span>
                <span className="text-lg font-bold text-ink-900">{g.label}</span>
              </div>
              <ul className="mt-2 space-y-2 text-sm text-ink-600">
                {g.points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <svg className="mt-0.5 shrink-0 text-gold-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
