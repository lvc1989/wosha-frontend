import React, { useState, useEffect } from "react";
import { api } from "../api.js";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();

export default function BusinessPlan() {
  const [targets, setTargets] = useState([]);
  const [actuals, setActuals] = useState({ revenue30d: 0, expenses30d: 0 });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ label: "", category: "Revenue", targetAmount: "" });
  const [open, setOpen] = useState(false);

  const load = () => api.getBusinessPlanProgress().then((d) => { setTargets(d.targets); setActuals(d.actuals); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e) => { e.preventDefault(); await api.addBusinessPlanTarget({ ...form, targetAmount: Number(form.targetAmount) }); setForm({ label: "", category: "Revenue", targetAmount: "" }); setOpen(false); load(); };
  const remove = async (id) => { await api.removeBusinessPlanTarget(id); load(); };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Business Plan</h1>
        <button onClick={() => setOpen(true)} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Target</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-4">
          <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-1">Revenue, last 30 days (actual)</div>
          <div style={{ color: C.ink }} className="text-xl font-bold">{money(actuals.revenue30d)}</div>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-4">
          <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-1">Expenses, last 30 days (actual)</div>
          <div style={{ color: C.ink }} className="text-xl font-bold">{money(actuals.expenses30d)}</div>
        </div>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {targets.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No targets set yet.</div>}
        {targets.map((t, i) => {
          const actual = t.category === "Revenue" ? actuals.revenue30d : actuals.expenses30d;
          const pct = Math.min(100, Math.round((actual / Number(t.target_amount)) * 100));
          return (
            <div key={t.id} className="px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ color: C.ink }} className="text-sm font-semibold">{t.label}</span>
                <div className="flex items-center gap-2">
                  <span style={{ color: C.textSoft }} className="text-xs">{money(actual)} / {money(t.target_amount)}</span>
                  <button onClick={() => remove(t.id)} className="text-xs" style={{ color: "#DC2626" }}>✕</button>
                </div>
              </div>
              <div style={{ background: C.border }} className="w-full h-2 rounded-full overflow-hidden">
                <div style={{ background: C.cyan, width: `${pct}%` }} className="h-full" />
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Add Target</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Label</label>
            <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Monthly revenue target" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              <option>Revenue</option>
              <option>Expenses</option>
            </select>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Target amount (TZS)</label>
            <input required type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
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
