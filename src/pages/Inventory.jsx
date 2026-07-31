import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useUser } from "../App.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626", dangerBg: "#FEE2E2" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();

export default function Inventory() {
  const { user } = useUser();
  const canEdit = user?.role === "owner" || user?.role === "manager";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", category: "", barcode: "", qty: "", reorderLevel: "", costPrice: "", sellPrice: "" });
  const [open, setOpen] = useState(false);

  const load = () => Promise.all([api.getProducts(), api.getCategories("product")]).then(([p, c]) => { setProducts(p); setCategories(c); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.addProduct({ ...form, qty: Number(form.qty), reorderLevel: Number(form.reorderLevel), costPrice: Number(form.costPrice), sellPrice: Number(form.sellPrice) });
    setForm({ name: "", category: "", barcode: "", qty: "", reorderLevel: "", costPrice: "", sellPrice: "" });
    setOpen(false);
    load();
  };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Inventory</h1>
        {canEdit && <button onClick={() => setOpen(true)} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Product</button>}
      </div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {products.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No products tracked yet.</div>}
        {products.map((p, i) => {
          const low = Number(p.qty) <= Number(p.reorder_level);
          return (
            <div key={p.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
              <div>
                <div style={{ color: C.ink }} className="text-sm font-semibold">{p.name}</div>
                <div style={{ color: C.textSoft }} className="text-xs">{p.qty} {p.unit} on hand · reorder at {p.reorder_level} · cost {money(p.cost_price)}</div>
              </div>
              {low && <span style={{ background: C.dangerBg, color: C.danger }} className="text-xs font-medium px-2.5 py-1 rounded-full">Low stock</span>}
            </div>
          );
        })}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Add Product</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Barcode (optional)</label>
            <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            {["qty", "reorderLevel", "costPrice", "sellPrice"].map((f) => (
              <div key={f}>
                <label className="text-xs font-semibold block mb-1 capitalize" style={{ color: C.textSoft }}>{f.replace(/([A-Z])/g, " $1")}</label>
                <input value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
