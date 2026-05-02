'use client';

// Auth gate is enforced by middleware.ts when Supabase is configured.
// In local mode, this page is unsecured — see admin/layout.jsx for the mode chip.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { productService } from '@/services/productService';
import { formatPrice } from '@/lib/money';

const CATEGORIES = ['iPhone', 'Android', 'Accessories', 'Cases', 'Chargers', 'Cables', 'Audio', 'PowerBanks', 'LaptopGear'];
const CONDITIONS = ['New', 'A', 'B', 'C'];

const EMPTY = {
  category: 'iPhone',
  name: '',
  storage: '',
  condition: 'A',
  price: '',
  stock: '',
  imageUrl: '/Apple-iPhone-13-Pro-Unlocked.png',
  isBestSeller: false,
};

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function deviceTypeFor(category) {
  if (category === 'iPhone') return 'iPhone';
  if (category === 'Android') return 'Android';
  if (category === 'LaptopGear') return 'Laptop';
  return 'Universal';
}

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    setProducts(await productService.getAll());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function reset() { setDraft(EMPTY); setEditingId(null); setError(''); }

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!draft.name.trim()) return setError('Name is required');
    if (draft.price === '' || Number(draft.price) < 0) return setError('Price must be ≥ 0');
    if (draft.stock === '' || Number(draft.stock) < 0) return setError('Stock must be ≥ 0');

    const slugBase = `${draft.name}${draft.storage ? `-${draft.storage}` : ''}-${draft.condition}`;

    try {
      if (editingId) {
        await productService.update(editingId, {
          name: draft.name.trim(),
          category: draft.category,
          condition: draft.condition,
          storage: draft.storage || undefined,
          price: Number(draft.price),
          stock: Number(draft.stock),
          isBestSeller: draft.isBestSeller,
          deviceType: deviceTypeFor(draft.category),
          images: [{ url: draft.imageUrl, alt: draft.name.trim() }],
        });
      } else {
        await productService.create({
          slug: slugify(slugBase),
          name: draft.name.trim(),
          category: draft.category,
          deviceType: deviceTypeFor(draft.category),
          compatibility: [],
          price: Number(draft.price),
          currency: 'USD',
          condition: draft.condition,
          storage: draft.storage || undefined,
          stock: Number(draft.stock),
          lowStockThreshold: 3,
          images: [{ url: draft.imageUrl, alt: draft.name.trim() }],
          description: '',
          bullets: [],
          tags: [],
          isBestSeller: draft.isBestSeller,
          bundleIds: [],
        });
      }
      reset();
      load();
    } catch (err) {
      setError(err.message || 'Save failed');
    }
  }

  async function remove(id) {
    if (!confirm('Delete this product?')) return;
    await productService.hardDelete(id);
    load();
  }

  async function adjustStock(id, delta) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const next = Math.max(0, p.stock + delta);
    await productService.update(id, { stock: next });
    load();
  }

  async function toggleBestSeller(p) {
    await productService.update(p.id, { isBestSeller: !p.isBestSeller });
    load();
  }

  function edit(p) {
    setEditingId(p.id);
    setDraft({
      category: p.category,
      name: p.name,
      storage: p.storage ?? '',
      condition: p.condition ?? 'A',
      price: String(p.price),
      stock: String(p.stock),
      imageUrl: p.images?.[0]?.url ?? '/placeholder.svg',
      isBestSeller: !!p.isBestSeller,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const kpis = useMemo(() => {
    const totalUnits = products.reduce((s, p) => s + p.stock, 0);
    const inventoryValue = products.reduce((s, p) => s + p.price * p.stock, 0);
    const low = products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 3)).length;
    const oos = products.filter((p) => p.stock === 0).length;
    return { totalUnits, inventoryValue, low, oos, total: products.length };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.name} ${p.storage ?? ''} ${p.category} ${p.id} ${p.slug}`.toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1 className="mt-1 text-3xl font-extrabold">Inventory admin</h1>
        </div>
        <Link href="/" className="btn-ghost">View storefront →</Link>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Products" value={kpis.total} />
        <Kpi label="Total units" value={kpis.totalUnits} />
        <Kpi label="Inventory value" value={formatPrice(kpis.inventoryValue)} />
        <Kpi
          label="Low / out of stock"
          value={`${kpis.low} low · ${kpis.oos} OOS`}
          tone={kpis.oos > 0 ? 'rose' : kpis.low > 0 ? 'amber' : 'emerald'}
        />
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
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="input md:col-span-2" placeholder="Name (e.g. iPhone 14 Pro)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className="input md:col-span-1" placeholder="Storage" value={draft.storage} onChange={(e) => setDraft({ ...draft, storage: e.target.value })} />
          <select className="input md:col-span-1" value={draft.condition} onChange={(e) => setDraft({ ...draft, condition: e.target.value })}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c === 'New' ? 'New' : `Grade ${c}`}</option>)}
          </select>
          <input className="input md:col-span-1" type="number" step="0.01" placeholder="Price" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          <input className="input md:col-span-1" type="number" placeholder="Stock" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-7">
          <input
            className="input md:col-span-5"
            placeholder="Image URL (e.g. /Apple-iPhone-13-Pro-Unlocked.png)"
            value={draft.imageUrl}
            onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
          />
          <label className="md:col-span-2 inline-flex items-center gap-2 px-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={draft.isBestSeller}
              onChange={(e) => setDraft({ ...draft, isBestSeller: e.target.checked })}
            />
            Mark as best seller
          </label>
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
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Storage</th>
                <th className="p-3 text-left">Condition</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-center">Best</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="p-6 text-center text-ink-400">Loading…</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-ink-400">No products match.</td></tr>
              )}
              {filtered.map((p) => {
                const low = p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 3);
                const oos = p.stock === 0;
                return (
                  <tr key={p.id} className="border-t border-ink-100 hover:bg-cream/50">
                    <td className="p-3">
                      <div className="font-semibold text-ink-900">{p.name}</div>
                      <div className="text-[11px] text-ink-400">{p.slug}</div>
                    </td>
                    <td className="p-3 text-ink-700">{p.category}</td>
                    <td className="p-3 text-ink-700">{p.storage ?? '—'}</td>
                    <td className="p-3">
                      {p.condition ? (
                        <span className={`badge ${p.condition === 'A' ? 'badge-green' : p.condition === 'B' ? 'badge-amber' : p.condition === 'C' ? 'badge-rose' : 'badge-ink'}`}>
                          {p.condition === 'New' ? 'New' : `Grade ${p.condition}`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-3 text-right font-semibold text-gold-700">{formatPrice(p.price, p.currency)}</td>
                    <td className="p-3">
                      <div className="inline-flex items-center gap-1">
                        <button className="h-7 w-7 rounded-full border border-ink-100 hover:border-ink-900" onClick={() => adjustStock(p.id, -1)}>−</button>
                        <span className={`w-10 text-center font-semibold ${oos ? 'text-rose-600' : low ? 'text-amber-600' : 'text-ink-900'}`}>
                          {p.stock}
                        </span>
                        <button className="h-7 w-7 rounded-full border border-ink-100 hover:border-ink-900" onClick={() => adjustStock(p.id, 1)}>+</button>
                      </div>
                      {oos && <div className="mt-1 text-[10px] font-semibold text-rose-600">Out of stock</div>}
                      {low && <div className="mt-1 text-[10px] font-semibold text-amber-600">Low stock</div>}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleBestSeller(p)}
                        className={`text-base ${p.isBestSeller ? 'text-gold-600' : 'text-ink-200 hover:text-ink-400'}`}
                        aria-label={p.isBestSeller ? 'Unmark best seller' : 'Mark best seller'}
                      >
                        ★
                      </button>
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
