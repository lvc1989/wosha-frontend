import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import CustomSelect from "../components/CustomSelect.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", amberBg: "#FEF3C7", amberDeep: "#92400E", successBg: "#E6F4EA" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "", amount: "", note: "" });
  const [open, setOpen] = useState(false);

  const load = () => Promise.all([api.getExpenses(), api.getCategories("expense")]).then(([e, c]) => { setExpenses(e); setCategories(c); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e) => { e.preventDefault(); await api.addExpense({ ...form, amount: Number(form.amount) }); setForm({ category: "", amount: "", note: "" }); setOpen(false); load(); };
  const decide = async (id, status) => { await api.decideExpense(id, status); load(); };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Expenses</h1>
        <button onClick={() => setOpen(true)} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Log Expense</button>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {expenses.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No expenses yet.</div>}
        {expenses.map((e, i) => (
          <div key={e.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{money(e.amount)} — {e.category}</div>
              <div style={{ color: C.textSoft }} className="text-xs">{e.note} · {new Date(e.expense_date).toLocaleDateString()}</div>
            </div>
            {e.status === "Pending Approval" ? (
              <div className="flex items-center gap-2">
                <span style={{ background: C.amberBg, color: C.amberDeep }} className="text-xs font-medium px-2.5 py-1 rounded-full">Pending</span>
                <button onClick={() => decide(e.id, "Approved")} className="text-xs font-semibold" style={{ color: C.cyan }}>Approve</button>
                <button onClick={() => decide(e.id, "Rejected")} className="text-xs font-semibold" style={{ color: "#DC2626" }}>Reject</button>
              </div>
            ) : (
              <span style={{ background: e.status === "Approved" ? C.successBg : "#FEE2E2", color: e.status === "Approved" ? "#166534" : "#DC2626" }} className="text-xs font-medium px-2.5 py-1 rounded-full">{e.status}</span>
            )}
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Log Expense</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Category</label>
            <div className="mb-3">
              <CustomSelect required value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={categories.map((c) => ({ value: c.name, label: c.name }))} />
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Amount (TZS)</label>
            <input required type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Note</label>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
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
