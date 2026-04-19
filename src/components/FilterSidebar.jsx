'use client';

// Rich sidebar filter modeled on Back Market / Best Buy. Parent owns state.
export default function FilterSidebar({
  categories,
  storages,
  filters,
  onChange,
  onClear,
  count,
  total,
}) {
  function toggleSet(key, value) {
    const cur = new Set(filters[key]);
    cur.has(value) ? cur.delete(value) : cur.add(value);
    onChange({ ...filters, [key]: Array.from(cur) });
  }

  return (
    <aside className="md:sticky md:top-32 md:self-start">
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-900">Filters</h3>
          <button type="button" onClick={onClear} className="text-xs font-semibold text-gold-700 hover:underline">
            Clear all
          </button>
        </div>
        <p className="mb-4 text-xs text-ink-500">
          Showing <span className="font-semibold text-ink-900">{count}</span> of {total}
        </p>

        <Group title="Category">
          {categories.map((c) => (
            <Check
              key={c}
              label={c}
              checked={filters.categories.includes(c)}
              onChange={() => toggleSet('categories', c)}
            />
          ))}
        </Group>

        <Group title="Condition">
          {['A', 'B', 'C'].map((c) => (
            <Check
              key={c}
              label={`Grade ${c}`}
              checked={filters.conditions.includes(c)}
              onChange={() => toggleSet('conditions', c)}
            />
          ))}
        </Group>

        {storages.length > 0 && (
          <Group title="Storage">
            {storages.map((s) => (
              <Check
                key={s}
                label={s}
                checked={filters.storages.includes(s)}
                onChange={() => toggleSet('storages', s)}
              />
            ))}
          </Group>
        )}

        <Group title="Model variant">
          {['Pro Max', 'Pro', 'Plus'].map((v) => (
            <Check
              key={v}
              label={v}
              checked={filters.variants.includes(v)}
              onChange={() => toggleSet('variants', v)}
            />
          ))}
        </Group>

        <Group title="Price (USD)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              className="input py-1.5 text-sm"
              value={filters.minPrice}
              onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
            />
            <span className="text-ink-300">–</span>
            <input
              type="number"
              placeholder="Max"
              className="input py-1.5 text-sm"
              value={filters.maxPrice}
              onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
            />
          </div>
        </Group>

        <label className="mt-2 flex items-center gap-2 text-xs text-ink-700">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
            className="h-4 w-4 rounded border-ink-200 text-ink-900 focus:ring-ink-900"
          />
          In stock only
        </label>
      </div>
    </aside>
  );
}

function Group({ title, children }) {
  return (
    <div className="border-t border-ink-100 py-4 first:border-t-0 first:pt-0">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-500">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700 hover:text-ink-900">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-ink-200 text-ink-900 focus:ring-ink-900"
      />
      <span>{label}</span>
    </label>
  );
}
