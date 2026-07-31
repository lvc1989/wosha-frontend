import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useUser } from "../App.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626", successBg: "#E6F4EA" };
const blank = { name: "", contact: "", email: "", category: "", capacity: "", criteria: "", leadTime: "", shortlisted: false };

export default function Suppliers() {
  const { user } = useUser();
  const canEdit = user?.role === "owner" || user?.role === "manager";
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => Promise.all([api.getSuppliers(), api.getCategories("supplier")]).then(([s, c]) => { setSuppliers(s); setCategories(c); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (s) => {
    setEditing(s.id);
    setForm({ name: s.name, contact: s.contact || "", email: s.email || "", category: s.category || "", capacity: s.capacity || "", criteria: s.criteria || "", leadTime: s.lead_time || "", shortlisted: s.shortlisted });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (editing) await api.updateSupplier(editing, form);
    else await api.addSupplier(form);
    setOpen(false);
    load();
  };
  const remove = async (id) => { if (confirm("Remove this supplier?")) { await api.removeSupplier(id); load(); } };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Suppliers</h1>
        {canEdit && <button onClick={openAdd} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Supplier</button>}
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {suppliers.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No suppliers yet — add one so purchase orders can request quotations.</div>}
        {suppliers.map((s, i) => (
          <div key={s.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{s.name} {s.shortlisted && <span style={{ background: C.successBg, color: "#166534" }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1">Shortlisted</span>}</div>
              <div style={{ color: C.textSoft }} className="text-xs">{s.category} · {s.email || "no email"} · {s.contact}</div>
            </div>
            <div className="flex items-center gap-3">
              {canEdit && <button onClick={() => openEdit(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>}
              {canEdit && <button onClick={() => remove(s.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6 max-h-[85vh] overflow-y-auto">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">{editing ? "Edit Supplier" : "Add Supplier"}</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              <option value="">Choose… (manage categories in Settings)</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Email (for quotation requests)</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Contact phone</label>
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Capacity</label>
            <input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. Bulk — 500L+/month" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Selection criteria / notes</label>
            <input value={form.criteria} onChange={(e) => setForm({ ...form, criteria: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Lead time</label>
            <input value={form.leadTime} onChange={(e) => setForm({ ...form, leadTime: e.target.value })} placeholder="e.g. 3 days" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="flex items-center gap-2 text-sm mb-4" style={{ color: C.ink }}>
              <input type="checkbox" checked={form.shortlisted} onChange={(e) => setForm({ ...form, shortlisted: e.target.checked })} />
              Shortlisted (eligible to be selected on purchase orders)
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
