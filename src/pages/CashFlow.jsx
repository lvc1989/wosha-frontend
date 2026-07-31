import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useUser } from "../App.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();

export default function CashFlow() {
  const { user } = useUser();
  const canEdit = user?.role === "owner" || user?.role === "manager";
  const [summary, setSummary] = useState([]);
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "", direction: "out", amount: "", note: "" });
  const [open, setOpen] = useState(false);

  const load = () => Promise.all([api.getCashSummary(), api.getCashEntries(), api.getCategories("cashflow")]).then(([s, e, c]) => { setSummary(s); setEntries(e); setCategories(c); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e) => { e.preventDefault(); await api.addCashEntry({ ...form, amount: Number(form.amount) }); setForm({ category: "", direction: "out", amount: "", note: "" }); setOpen(false); load(); };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Cash Flow</h1>
        {canEdit && <button onClick={() => setOpen(true)} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Entry</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {summary.map((s) => (
          <div key={s.location_id} style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-4">
            <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">{s.name}</div>
            <div className="flex justify-between text-xs mb-1"><span style={{ color: C.textSoft }}>In</span><span style={{ color: "#166534" }}>{money(s.cash_in)}</span></div>
            <div className="flex justify-between text-xs mb-1"><span style={{ color: C.textSoft }}>Out</span><span style={{ color: C.danger }}>{money(s.cash_out)}</span></div>
            <div className="flex justify-between text-sm font-bold mt-2 pt-2" style={{ borderTop: `1px solid ${C.border}`, color: C.ink }}><span>Net</span><span>{money(s.net)}</span></div>
          </div>
        ))}
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Manual entries</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {entries.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No manual entries — invoices and expenses already flow in automatically above.</div>}
        {entries.map((e, i) => (
          <div key={e.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{e.category}</div>
              <div style={{ color: C.textSoft }} className="text-xs">{e.note}</div>
            </div>
            <span style={{ color: e.direction === "in" ? "#166534" : C.danger }} className="text-sm font-semibold">{e.direction === "in" ? "+" : "-"}{money(e.amount)}</span>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Add Cash Entry</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Category</label>
            <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Direction</label>
            <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              <option value="in">Money in</option>
              <option value="out">Money out</option>
            </select>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Amount (TZS)</label>
            <input required type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
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
