'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'mansa:admin_banners';

const EMPTY = {
  id: '',
  title: '',
  subtitle: '',
  cta_label: '',
  link_url: '',
  image_url: '',
  is_active: true,
};

function loadBanners() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBanners(banners) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setBanners(loadBanners());
  }, []);

  function openNew() {
    setForm({ ...EMPTY, id: `banner_${Date.now()}` });
    setEditing('new');
  }

  function openEdit(b) {
    setForm({ ...b });
    setEditing(b.id);
  }

  function save() {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const updated =
      editing === 'new'
        ? [...banners, form]
        : banners.map((b) => (b.id === editing ? form : b));
    setBanners(updated);
    saveBanners(updated);
    toast.success(editing === 'new' ? 'Banner created' : 'Banner updated');
    setEditing(null);
  }

  function remove(id) {
    if (!confirm('Delete this banner?')) return;
    const updated = banners.filter((b) => b.id !== id);
    setBanners(updated);
    saveBanners(updated);
    toast.success('Banner deleted');
  }

  function toggleActive(id) {
    const updated = banners.map((b) => b.id === id ? { ...b, is_active: !b.is_active } : b);
    setBanners(updated);
    saveBanners(updated);
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Banners</h1>
          <p className="mt-0.5 text-sm text-charcoal-500">Manage homepage promotional banners</p>
        </div>
        <button onClick={openNew} className="btn-primary gap-2">
          <Plus size={15} /> New Banner
        </button>
      </div>

      {/* Form modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-charcoal-100 bg-white shadow-card-lg animate-fade-in">
            <div className="flex items-center justify-between border-b border-charcoal-100 px-6 py-4">
              <h2 className="text-base font-bold text-charcoal-900">
                {editing === 'new' ? 'New Banner' : 'Edit Banner'}
              </h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-charcoal-400 hover:bg-charcoal-50">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" placeholder="Summer Sale — Up to 30% off" />
              </div>
              <div>
                <label className="label">Subtitle</label>
                <input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} className="input" placeholder="Explore the latest accessories" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">CTA Label</label>
                  <input value={form.cta_label} onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))} className="input" placeholder="Shop Now" />
                </div>
                <div>
                  <label className="label">Link URL</label>
                  <input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} className="input" placeholder="/shop" />
                </div>
              </div>
              <div>
                <label className="label">Image URL</label>
                <input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} className="input" placeholder="https://…" />
              </div>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 accent-charcoal-900" />
                <span className="text-sm font-medium text-charcoal-700">Active (show on storefront)</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-charcoal-100 px-6 py-4">
              <button onClick={() => setEditing(null)} className="btn-secondary-sm">Cancel</button>
              <button onClick={save} className="btn-primary gap-2">
                <Save size={14} />
                {editing === 'new' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner list */}
      {banners.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-charcoal-200 py-20 text-center">
          <p className="text-sm text-charcoal-400">No banners yet.</p>
          <button onClick={openNew} className="mt-4 btn-primary-sm gap-1.5">
            <Plus size={13} /> Create first banner
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="flex items-center gap-4 rounded-2xl border border-charcoal-100 bg-white p-4 shadow-card">
              {b.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.image_url} alt="" className="h-16 w-24 flex-shrink-0 rounded-xl object-cover bg-charcoal-100" />
              ) : (
                <div className="h-16 w-24 flex-shrink-0 rounded-xl bg-charcoal-100" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-charcoal-900">{b.title}</p>
                  <span className={`badge ${b.is_active ? 'badge-green' : 'badge-gray'}`}>
                    {b.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {b.subtitle && <p className="text-sm text-charcoal-500">{b.subtitle}</p>}
                {b.link_url && <p className="text-xs text-charcoal-400">{b.link_url}</p>}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => toggleActive(b.id)} className="rounded-lg p-1.5 text-charcoal-400 hover:bg-charcoal-50 transition">
                  {b.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={() => openEdit(b)} className="rounded-lg p-1.5 text-charcoal-400 hover:bg-charcoal-50 transition">
                  <Pencil size={15} />
                </button>
                <button onClick={() => remove(b.id)} className="rounded-lg p-1.5 text-charcoal-400 hover:bg-red-50 hover:text-red-600 transition">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
