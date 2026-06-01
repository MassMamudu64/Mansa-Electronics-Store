'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Loader2,
  Pencil,
  Plus,
  Save,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react';
import { formatPrice } from '@/lib/money';
import PricingTabs from '@/components/admin/PricingTabs';

const SCOPES = [
  { value: 'global',   label: 'Global',   needsValue: false, placeholder: '—' },
  { value: 'category', label: 'Category', needsValue: true,  placeholder: 'iPhone' },
  { value: 'brand',    label: 'Brand',    needsValue: true,  placeholder: 'Apple' },
  { value: 'sku',      label: 'SKU',      needsValue: true,  placeholder: 'WS-IP14-128-A' },
];

const SCOPE_TONE = {
  sku:      'badge-blue',
  brand:    'badge-amber',
  category: 'badge-green',
  global:   'badge-gray',
};

const EMPTY_FORM = {
  name: '',
  scope: 'global',
  scopeValue: '',
  markupPct: '30',
  floorPrice: '',
  ceilingPrice: '',
  priority: '0',
  active: true,
};

function toPayload(form) {
  const scopeRow = SCOPES.find((s) => s.value === form.scope);
  return {
    name: form.name.trim(),
    scope: form.scope,
    scopeValue: scopeRow?.needsValue ? form.scopeValue.trim() || null : null,
    markupPct: Number(form.markupPct),
    floorPrice: form.floorPrice === '' ? null : Number(form.floorPrice),
    ceilingPrice: form.ceilingPrice === '' ? null : Number(form.ceilingPrice),
    priority: Number(form.priority) || 0,
    active: Boolean(form.active),
  };
}

function fromRule(r) {
  return {
    name: r.name ?? '',
    scope: r.scope ?? 'global',
    scopeValue: r.scopeValue ?? '',
    markupPct: String(r.markupPct ?? '0'),
    floorPrice: r.floorPrice == null ? '' : String(r.floorPrice),
    ceilingPrice: r.ceilingPrice == null ? '' : String(r.ceilingPrice),
    priority: String(r.priority ?? '0'),
    active: r.active ?? true,
  };
}

export default function PricingRulesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | rule id
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'pricing', 'rules'],
    queryFn: () => fetch('/api/pricing/rules').then((r) => r.json()),
  });

  const rules = data?.rules ?? [];

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      const isNew = editing === 'new';
      const url = isNew ? '/api/pricing/rules' : `/api/pricing/rules/${editing}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(formData)),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Save failed');
      return body.rule;
    },
    onSuccess: () => {
      toast.success(editing === 'new' ? 'Rule created' : 'Rule updated');
      qc.invalidateQueries({ queryKey: ['admin', 'pricing', 'rules'] });
      setEditing(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }) => {
      const res = await fetch(`/api/pricing/rules/${id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Toggle failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Rule updated');
      qc.invalidateQueries({ queryKey: ['admin', 'pricing', 'rules'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/pricing/rules/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      toast.success('Rule deleted');
      qc.invalidateQueries({ queryKey: ['admin', 'pricing', 'rules'] });
    },
    onError: (err) => toast.error(err.message),
  });

  function openNew() {
    setForm(EMPTY_FORM);
    setEditing('new');
  }

  function openEdit(r) {
    setForm(fromRule(r));
    setEditing(r.id);
  }

  const scopeRow = SCOPES.find((s) => s.value === form.scope) ?? SCOPES[0];
  const canSave =
    !!form.name.trim() &&
    form.markupPct !== '' &&
    !Number.isNaN(Number(form.markupPct)) &&
    (!scopeRow.needsValue || form.scopeValue.trim().length > 0);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-charcoal-900">Pricing</h1>
          <p className="mt-0.5 text-sm text-charcoal-500">
            {rules.length} rule{rules.length === 1 ? '' : 's'} configured
          </p>
        </div>
        <button onClick={openNew} className="btn-primary gap-2">
          <Plus size={15} /> New Rule
        </button>
      </div>

      <PricingTabs />

      {/* Modal form */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal-950/60 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-xl rounded-2xl border border-charcoal-100 bg-white shadow-card-lg animate-fade-in">
            <div className="flex items-center justify-between border-b border-charcoal-100 px-6 py-4">
              <h2 className="text-base font-bold text-charcoal-900">
                {editing === 'new' ? 'New Rule' : 'Edit Rule'}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg p-1.5 text-charcoal-400 hover:bg-charcoal-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="label">Rule Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input"
                  placeholder="iPhone A-grade 35% markup"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Scope</label>
                  <select
                    value={form.scope}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, scope: e.target.value, scopeValue: '' }))
                    }
                    className="input"
                  >
                    {SCOPES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">
                    Scope Value {scopeRow.needsValue ? '*' : ''}
                  </label>
                  <input
                    disabled={!scopeRow.needsValue}
                    value={scopeRow.needsValue ? form.scopeValue : ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, scopeValue: e.target.value }))
                    }
                    className="input disabled:bg-charcoal-50 disabled:text-charcoal-400"
                    placeholder={scopeRow.placeholder}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Markup % *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="-100"
                    max="1000"
                    value={form.markupPct}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, markupPct: e.target.value }))
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Floor $</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.floorPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, floorPrice: e.target.value }))
                    }
                    className="input"
                    placeholder="–"
                  />
                </div>
                <div>
                  <label className="label">Ceiling $</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.ceilingPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ceilingPrice: e.target.value }))
                    }
                    className="input"
                    placeholder="–"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Priority</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priority: e.target.value }))
                    }
                    className="input"
                  />
                  <p className="mt-1 text-[11px] text-charcoal-400">
                    Higher wins when multiple rules at same scope match.
                  </p>
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, active: e.target.checked }))
                      }
                      className="h-4 w-4 accent-charcoal-900"
                    />
                    <span className="text-sm font-medium text-charcoal-700">
                      Active
                    </span>
                  </label>
                </div>
              </div>

              <p className="rounded-xl bg-charcoal-50 px-3 py-2 text-[11px] leading-relaxed text-charcoal-600">
                <span className="font-semibold">Precedence:</span> sku &gt; brand &gt; category &gt; global.
                Among rules of the same scope, higher <span className="font-mono">priority</span> wins.
                Floor and ceiling clamp the markup result.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-charcoal-100 px-6 py-4">
              <button onClick={() => setEditing(null)} className="btn-secondary-sm">
                Cancel
              </button>
              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={!canSave || saveMutation.isPending}
                className="btn-primary gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {editing === 'new' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-card">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-charcoal-400">
            Loading rules…
          </div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-charcoal-400">No rules yet.</p>
            <button onClick={openNew} className="mt-4 btn-primary-sm gap-1.5">
              <Plus size={13} /> Create first rule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-charcoal-100 bg-charcoal-50">
                  <th className="table-header px-5 py-3">Name</th>
                  <th className="table-header px-5 py-3">Scope</th>
                  <th className="table-header px-5 py-3">Markup</th>
                  <th className="table-header px-5 py-3">Floor</th>
                  <th className="table-header px-5 py-3">Ceiling</th>
                  <th className="table-header px-5 py-3">Priority</th>
                  <th className="table-header px-5 py-3">Status</th>
                  <th className="table-header px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr
                    key={r.id}
                    className={`table-row ${r.active ? '' : 'bg-charcoal-50/40'}`}
                  >
                    <td className="table-cell px-5">
                      <p className="font-semibold text-charcoal-900">{r.name}</p>
                      {r.updatedBy && (
                        <p className="text-[11px] text-charcoal-400">
                          by {r.updatedBy}
                        </p>
                      )}
                    </td>
                    <td className="table-cell px-5">
                      <span className={`badge ${SCOPE_TONE[r.scope] ?? 'badge-gray'}`}>
                        {r.scope}
                      </span>
                      {r.scopeValue && (
                        <span className="ml-2 font-mono text-[11px] text-charcoal-500">
                          {r.scopeValue}
                        </span>
                      )}
                    </td>
                    <td className="table-cell px-5 font-semibold">
                      {r.markupPct}%
                    </td>
                    <td className="table-cell px-5 text-charcoal-500">
                      {r.floorPrice == null
                        ? '—'
                        : formatPrice(r.floorPrice, 'USD')}
                    </td>
                    <td className="table-cell px-5 text-charcoal-500">
                      {r.ceilingPrice == null
                        ? '—'
                        : formatPrice(r.ceilingPrice, 'USD')}
                    </td>
                    <td className="table-cell px-5">{r.priority}</td>
                    <td className="table-cell px-5">
                      <button
                        type="button"
                        onClick={() =>
                          toggleMutation.mutate({ id: r.id, active: !r.active })
                        }
                        disabled={toggleMutation.isPending}
                        className="flex items-center gap-1.5 text-charcoal-500 hover:text-charcoal-900"
                        title={r.active ? 'Deactivate' : 'Activate'}
                      >
                        {r.active ? (
                          <ToggleRight size={20} className="text-emerald-600" />
                        ) : (
                          <ToggleLeft size={20} className="text-charcoal-300" />
                        )}
                        <span className="text-xs">
                          {r.active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="table-cell px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(r)}
                          className="rounded-lg p-1.5 text-charcoal-400 transition hover:bg-charcoal-50 hover:text-charcoal-900"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete rule "${r.name}"?`))
                              deleteMutation.mutate(r.id);
                          }}
                          className="rounded-lg p-1.5 text-charcoal-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
