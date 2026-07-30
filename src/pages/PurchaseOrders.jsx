import React, { useState, useEffect } from "react";
import { api } from "../api.js";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", amberBg: "#FEF3C7", amberDeep: "#92400E" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();

export default function PurchaseOrders() {
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([{ name: "", spec: "", qty: 1 }]);
  const [open, setOpen] = useState(false);

  const load = () => Promise.all([api.getPurchaseOrders(), api.getSuppliers()]).then(([p, s]) => { setPos(p); setSuppliers(s); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const addRow = () => setItems([...items, { name: "", spec: "", qty: 1 }]);
  const updateRow = (i, field, val) => setItems(items.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
  const removeRow = (i) => setItems(items.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    await api.createPurchaseOrder({ items: items.filter((it) => it.name) });
    setItems([{ name: "", spec: "", qty: 1 }]);
    setOpen(false);
    load();
  };

  const decide = async (id, status) => { await api.decidePurchaseOrder(id, status); load(); };
  const assignSupplier = async (id, supplierId) => { await api.assignPOSupplier(id, supplierId); load(); };
  const receive = async (id) => { await api.receivePurchaseOrder(id); load(); };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Purchase Orders</h1>
        <button onClick={() => setOpen(true)} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ New Purchase Order</button>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {pos.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No purchase orders yet.</div>}
        {pos.map((po, i) => (
          <div key={po.id} className="px-5 py-4" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div style={{ color: C.ink }} className="text-sm font-semibold">PO-{po.id.slice(-5).toUpperCase()} · {po.items.length} item(s)</div>
              <span style={{ background: C.amberBg, color: C.amberDeep }} className="text-xs font-medium px-2.5 py-1 rounded-full">{po.status}</span>
            </div>
            <div style={{ color: C.textSoft }} className="text-xs mb-2">{po.items.map((it) => `${it.name} x${it.qty}`).join(", ")}</div>
            {po.status === "Pending Approval" && (
              <div className="flex gap-2">
                <button onClick={() => decide(po.id, "Approved")} className="text-xs font-semibold" style={{ color: C.cyan }}>Approve</button>
                <button onClick={() => decide(po.id, "Rejected")} className="text-xs font-semibold" style={{ color: "#DC2626" }}>Reject</button>
              </div>
            )}
            {po.status === "Approved" && (
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <select value={po.supplier_id || ""} onChange={(e) => assignSupplier(po.id, e.target.value)} style={{ borderColor: C.border }} className="border rounded-lg px-2 py-1 text-xs">
                  <option value="">Assign supplier…</option>
                  {suppliers.filter((s) => s.shortlisted).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={() => receive(po.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>Mark Received</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-lg rounded-xl p-6 max-h-[85vh] overflow-y-auto">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">New Purchase Order</div>
            {items.map((it, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input placeholder="Item name" value={it.name} onChange={(e) => updateRow(i, "name", e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-2 py-1.5 text-sm" />
                <input placeholder="Spec" value={it.spec} onChange={(e) => updateRow(i, "spec", e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-2 py-1.5 text-sm" />
                <input type="number" value={it.qty} onChange={(e) => updateRow(i, "qty", e.target.value)} style={{ borderColor: C.border, width: 60 }} className="border rounded-lg px-2 py-1.5 text-sm" />
                <button type="button" onClick={() => removeRow(i)} className="text-xs" style={{ color: "#DC2626" }}>✕</button>
              </div>
            ))}
            <button type="button" onClick={addRow} className="text-xs font-semibold mb-4" style={{ color: C.cyan }}>+ Add another item</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Submit Order</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
