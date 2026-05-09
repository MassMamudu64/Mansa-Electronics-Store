'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, X, Save, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/money';

const EMPTY_FORM = {
  name: '', category: 'Accessories', brand: '', price: '', compare_at_price: '',
  stock: '0', sku: '', description: '', image_url: '', isBestSeller: false,
};

const CATEGORIES = ['iPhone', 'Chargers', 'Audio', 'Cases', 'Cables', 'PowerBanks', 'Accessories'];

const STATUS_BADGE = {
  in_stock: 'badge-green',
  low_stock: 'badge-amber',
  out_of_stock: 'badge-red',
};

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | product-id
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => fetch('/api/products').then((r) => r.json()),
  });

  const products = (data?.products ?? []).filter((p) => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return p.name?.toLowerCase().includes(lower) || p.category?.toLowerCase().includes(lower) || p.sku?.toLowerCase().includes(lower);
  });

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      const isNew = editing === 'new';
      const url = isNew ? '/api/products' : `/api/products/${editing}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : null,
          stock: Number(formData.stock),
          images: formData.image_url ? [{ url: formData.image_url, alt: formData.name }] : [],
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success(editing === 'new' ? 'Product created' : 'Product updated');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      setEditing(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      toast.success('Product archived');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err) => toast.error(err.message),
  });

  function openNew() {
    setForm(EMPTY_FORM);
    setEditing('new');
  }

  function openEdit(product) {
    setForm({
      name: product.name ?? '',
      category: product.category ?? 'Accessories',
      brand: product.brand ?? '',
      price: String(product.price ?? ''),
      compare_at_price: String(product.compare_at_price ?? ''),
      stock: String(product.stock ?? '0'),
      sku: product.sku ?? '',
      description: product.description ?? '',
      image_url: product.image_url ?? product.images?.[0]?.url ?? '',
      isBestSeller: product.isBestSeller ?? product.is_best_seller ?? false,
    });
    setEditing(product.id);
  }

  function stockStatus(p) {
    const s = p.stock ?? 0;
    if (s <= 0) return 'out_of_stock';
    if (s <= (p.lowStockThreshold ?? 3)) return 'low_stock';
    return 'in_stock';
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Products</h1>
          <p className="mt-0.5 text-sm text-charcoal-500">{products.length} products</p>
        </div>
        <button onClick={openNew} className="btn-primary gap-2">
          <Plus size={15} /> New Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-xs">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products…"
          className="input-sm pl-9"
        />
      </div>

      {/* Product form modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal-950/60 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-xl rounded-2xl border border-charcoal-100 bg-white shadow-card-lg animate-fade-in">
            <div className="flex items-center justify-between border-b border-charcoal-100 px-6 py-4">
              <h2 className="text-base font-bold text-charcoal-900">
                {editing === 'new' ? 'New Product' : 'Edit Product'}
              </h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-charcoal-400 hover:bg-charcoal-50">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Product Name *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" placeholder="e.g. iPhone 14 Pro" />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Brand</label>
                  <input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className="input" placeholder="Apple, Samsung…" />
                </div>
                <div>
                  <label className="label">Price (USD) *</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Compare-at Price</label>
                  <input type="number" step="0.01" min="0" value={form.compare_at_price} onChange={(e) => setForm((f) => ({ ...f, compare_at_price: e.target.value }))} className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Stock Quantity</label>
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">SKU</label>
                  <input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="input" placeholder="ME-001" />
                </div>
                <div className="col-span-2">
                  <label className="label">Image URL</label>
                  <input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} className="input" placeholder="https://…" />
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input resize-none" placeholder="Short product description…" />
                </div>
                <div className="col-span-2">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={form.isBestSeller} onChange={(e) => setForm((f) => ({ ...f, isBestSeller: e.target.checked }))} className="h-4 w-4 accent-charcoal-900" />
                    <span className="text-sm font-medium text-charcoal-700">Mark as Best Seller</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-charcoal-100 px-6 py-4">
              <button onClick={() => setEditing(null)} className="btn-secondary-sm">Cancel</button>
              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={!form.name || !form.price || saveMutation.isPending}
                className="btn-primary gap-2"
              >
                {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editing === 'new' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-charcoal-100 bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-charcoal-400">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-charcoal-400">No products found.</p>
            <button onClick={openNew} className="mt-4 btn-primary-sm gap-1.5">
              <Plus size={13} /> Add first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-charcoal-100 bg-charcoal-50">
                  <th className="table-header px-5 py-3">Product</th>
                  <th className="table-header px-5 py-3">Category</th>
                  <th className="table-header px-5 py-3">Price</th>
                  <th className="table-header px-5 py-3">Stock</th>
                  <th className="table-header px-5 py-3">Status</th>
                  <th className="table-header px-5 py-3" />
                  <th className="table-header px-5 py-3">106</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const status = stockStatus(p);
                  return (
                    <tr key={p.id} className="table-row">
                      <td className="table-cell px-5">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image_url ?? p.images?.[0]?.url ?? '/placeholder.svg'} alt="" className="h-10 w-10 rounded-lg object-cover bg-charcoal-50" />
                          <div>
                            <p className="font-semibold text-charcoal-900">{p.name}</p>
                            {p.sku && <p className="text-xs text-charcoal-400">{p.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell px-5 text-charcoal-500">{p.category}</td>
                      <td className="table-cell px-5 font-semibold">{formatPrice(p.price ?? 0, 'USD')}</td>
                      <td className="table-cell px-5">{p.stock ?? 0}</td>
                      <td className="table-cell px-5">
                        <span className={`badge ${STATUS_BADGE[status]}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell px-5">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-charcoal-400 hover:bg-charcoal-50 hover:text-charcoal-900 transition">
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Archive "${p.name}"?`)) deleteMutation.mutate(p.id); }}
                            className="rounded-lg p-1.5 text-charcoal-400 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
