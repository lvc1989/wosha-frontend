import React, { useState, useEffect } from "react";
import { api } from "../api.js";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", successBg: "#E6F4EA" };

export default function Marketing() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", discountPercent: "", targetSegment: "All" });
  const [open, setOpen] = useState(false);

  const load = () => api.getPromotions().then(setPromos).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e) => { e.preventDefault(); await api.addPromotion({ ...form, discountPercent: Number(form.discountPercent) }); setForm({ name: "", discountPercent: "", targetSegment: "All" }); setOpen(false); load(); };
  const toggle = async (id) => { await api.togglePromotion(id); load(); };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Marketing</h1>
        <button onClick={() => setOpen(true)} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ New Promotion</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.length === 0 && <div className="text-sm" style={{ color: C.textSoft }}>No promotions yet.</div>}
        {promos.map((p) => (
          <div key={p.id} style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-4">
            <div style={{ color: C.ink }} className="text-sm font-semibold mb-1">{p.name}</div>
            <div style={{ color: C.textSoft }} className="text-xs mb-3">{p.discount_percent}% off · Target: {p.target_segment}</div>
            <div className="flex items-center gap-2">
              <span style={{ background: p.status === "Active" ? C.successBg : "#F1F2F4", color: p.status === "Active" ? "#166534" : "#667085" }} className="text-xs font-medium px-2.5 py-1 rounded-full">{p.status}</span>
              <button onClick={() => toggle(p.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>{p.status === "Active" ? "End" : "Reactivate"}</button>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">New Promotion</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Discount %</label>
            <input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
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
