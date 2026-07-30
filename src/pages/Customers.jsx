import React, { useState, useEffect } from "react";
import { api } from "../api.js";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [open, setOpen] = useState(false);

  const load = () => api.getCustomers().then(setCustomers).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.addCustomer(form);
    setForm({ name: "", phone: "", email: "" });
    setOpen(false);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Customers</h1>
        <button onClick={() => setOpen(true)} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Customer</button>
      </div>

      {loading ? (
        <div style={{ color: C.textSoft }}>Loading…</div>
      ) : (
        <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
          {customers.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No customers yet.</div>}
          {customers.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
              <div>
                <div style={{ color: C.ink }} className="text-sm font-semibold">{c.name}</div>
                <div style={{ color: C.textSoft }} className="text-xs">{c.phone} {c.email ? `· ${c.email}` : ""}</div>
              </div>
              <span style={{ color: C.textSoft }} className="text-xs">{c.tag}</span>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Add Customer</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Full name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Email (optional)</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
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
