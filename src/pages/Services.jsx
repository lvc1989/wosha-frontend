import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useUser } from "../App.jsx";
import CustomSelect from "../components/CustomSelect.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", amberBg: "#FEF3C7", amberDeep: "#92400E" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();

export default function Services() {
  const { user } = useUser();
  const canEdit = user?.role === "owner" || user?.role === "manager";
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", category: "", price: "", durationMin: "30" });
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => Promise.all([api.getServices(), api.getCategories("service")]).then(([s, c]) => { setServices(s); setCategories(c); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", category: "", price: "", durationMin: "30" }); setOpen(true); };
  const openEdit = (s) => { setEditing(s.id); setForm({ name: s.name, category: s.category, price: s.price, durationMin: s.duration_min }); setOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { name: form.name, category: form.category, price: Number(form.price), durationMin: Number(form.durationMin) };
    if (editing) await api.updateService(editing, payload);
    else await api.addService(payload);
    setOpen(false);
    load();
  };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  const byCategory = services.reduce((acc, s) => { (acc[s.category] = acc[s.category] || []).push(s); return acc; }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Services</h1>
        {canEdit && <button onClick={openAdd} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Service</button>}
      </div>

      {!canEdit && <div style={{ background: C.amberBg, color: C.amberDeep }} className="rounded-lg px-4 py-2 text-xs mb-4">Pricing is managed by branch managers and ownership. You have view-only access here.</div>}

      {Object.keys(byCategory).length === 0 && <div style={{ color: C.textSoft }} className="text-sm">No services yet — add your price list here.</div>}

      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category} className="mb-6">
          <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-2">{category}</div>
          <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
            {items.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
                <div>
                  <div style={{ color: C.ink }} className="text-sm font-semibold">{s.name}</div>
                  <div style={{ color: C.textSoft }} className="text-xs">{s.duration_min} min</div>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: C.ink, fontFamily: "monospace" }} className="text-sm font-semibold">{money(s.price)}</span>
                  {canEdit && <button onClick={() => openEdit(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">{editing ? "Edit Service" : "Add Service"}</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Category</label>
            <div className="mb-3">
              <CustomSelect required value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={categories.map((c) => ({ value: c.name, label: c.name }))} />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Price (TZS)</label>
                <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Duration (min)</label>
                <input type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
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
