'use client';

// NOTE: No auth — spec calls for open admin in MVP. Put behind middleware
// before exposing publicly.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const EMPTY = {
  category: 'iPhone',
  model: '',
  storage: '',
  condition: 'A',
  price: '',
  quantity: '',
  image: '/placeholder.svg',
};

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    const r = await fetch('/api/products');
    setProducts(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function reset() { setDraft(EMPTY); setEditingId(null); setError(''); }

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!draft.model.trim()) return setError('Model is required');
    if (draft.price === '' || Number(draft.price) < 0) return setError('Price must be ≥ 0');
    if (draft.quantity === '' || Number(draft.quantity) < 0) return setError('Quantity must be ≥ 0');

    const payload = { ...draft, price: Number(draft.price), quantity: Number(draft.quantity) };
    const res = editingId
      ? await fetch(`/api/products/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { setError((await res.json()).error || 'Save failed'); return; }
    reset();
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    load();
  }

  async function adjustQty(id, delta) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const next = Math.max(0, p.quantity + delta);
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: next }),
    });
    load();
  }

  function edit(p) {
    setEditingId(p.id);
    setDraft({ ...p, price: String(p.price), quantity: String(p.quantity) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // KPIs
  const kpis = useMemo(() => {
    const totalUnits = products.reduce((s, p) => s + p.quantity, 0);
    const inventoryValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
    const low = products.filter((p) => p.quantity > 0 && p.quantity <= 3).length;
    const oos = products.filter((p) => p.quantity === 0).length;
    return { totalUnits, inventoryValue, low, oos, total: products.length };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.model} ${p.storage} ${p.category} ${p.id}`.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1 className="mt-1 text-3xl font-extrabold">Inventory admin</h1>
          <p className="mt-1 text-xs text-ink-400">Unsecured MVP — do not expose publicly.</p>
        </div>
        <Link href="/" className="btn-ghost">View storefront →</Link>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Products" value={kpis.total} />
        <Kpi label="Total units" value={kpis.totalUnits} />
        <Kpi label="Inventory value" value={`$${kpis.inventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <Kpi label="Low / out of stock" value={`${kpis.low} low · ${kpis.oos} OOS`} tone={kpis.oos > 0 ? 'rose' : kpis.low > 0 ? 'amber' : 'emerald'} />
      </div>

      {/* Form */}
      <form onSubmit={save} className="card-elev mb-8 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-500">
            {editingId ? 'Edit product' : 'Add product'}
          </h2>
          {editingId && <button type="button" className="btn-link" onClick={reset}>Cancel edit</button>}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
          <select className="input md:col-span-1" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            <option>iPhone</option>
            <option>Accessories</option>
          </select>
          <input className="input md:col-span-2" placeholder="Model (e.g. iPhone 14 Pro)" value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} />
          <input className="input md:col-span-1" placeholder="Storage" value={draft.storage} onChange={(e) => setDraft({ ...draft, storage: e.target.value })} />
          <select className="input md:col-span-1" value={draft.condition} onChange={(e) => setDraft({ ...draft, condition: e.target.value })}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
          </select>
          <input className="input md:col-span-1" type="number" step="0.01" placeholder="Price" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          <input className="input md:col-span-1" type="number" placeholder="Qty" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} />
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">{error}</div>
        )}

        <div className="mt-4 flex gap-2">
          <button type="submit" className="btn-primary">{editingId ? 'Update product' : 'Add product'}</button>
        </div>
      </form>

      {/* Table */}
      <div className="card-elev overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 bg-cream p-3">
          <h2 className="text-sm font-semibold text-ink-900">Products</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="input max-w-xs py-1.5"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white text-xs uppercase tracking-widest text-ink-400">
              <tr className="border-b border-ink-100">
                <th className="p-3 text-left">Model</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Storage</th>
                <th className="p-3 text-left">Condition</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-center">Quantity</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-6 text-center text-ink-400">Loading…</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-ink-400">No products match.</td></tr>
              )}
              {filtered.map((p) => {
                const low = p.quantity > 0 && p.quantity <= 3;
                const oos = p.quantity === 0;
                return (
                  <tr key={p.id} className="border-t border-ink-100 hover:bg-cream/50">
                    <td className="p-3">
                      <div className="font-semibold text-ink-900">{p.model}</div>
                      <div className="text-[11px] text-ink-400">{p.id}</div>
                    </td>
                    <td className="p-3 text-ink-700">{p.category}</td>
                    <td className="p-3 text-ink-700">{p.storage}</td>
                    <td className="p-3">
                      <span className={`badge ${p.condition === 'A' ? 'badge-green' : p.condition === 'B' ? 'badge-amber' : 'badge-rose'}`}>
                        Grade {p.condition}
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold text-gold-700">${p.price.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="inline-flex items-center gap-1">
                        <button className="h-7 w-7 rounded-full border border-ink-100 hover:border-ink-900" onClick={() => adjustQty(p.id, -1)}>−</button>
                        <span className={`w-10 text-center font-semibold ${oos ? 'text-rose-600' : low ? 'text-amber-600' : 'text-ink-900'}`}>
                          {p.quantity}
                        </span>
                        <button className="h-7 w-7 rounded-full border border-ink-100 hover:border-ink-900" onClick={() => adjustQty(p.id, 1)}>+</button>
                      </div>
                      {oos && <div className="mt-1 text-[10px] font-semibold text-rose-600">Out of stock</div>}
                      {low && <div className="mt-1 text-[10px] font-semibold text-amber-600">Low stock</div>}
                    </td>
                    <td className="p-3 text-right">
                      <button className="btn-link mr-3" onClick={() => edit(p)}>Edit</button>
                      <button className="text-xs font-semibold text-rose-600 hover:underline" onClick={() => remove(p.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone = 'ink' }) {
  const toneCls = {
    ink: 'ring-ink-100',
    rose: 'ring-rose-200 bg-rose-50/40',
    amber: 'ring-amber-200 bg-amber-50/40',
    emerald: 'ring-emerald-200 bg-emerald-50/40',
  }[tone];
  return (
    <div className={`card p-5 ring-1 ${toneCls}`}>
      <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-ink-900">{value}</div>
    </div>
  );
}
