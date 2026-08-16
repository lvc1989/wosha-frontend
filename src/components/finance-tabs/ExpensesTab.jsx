import React, { useState, useEffect } from "react";
import { Wallet, Plus } from "lucide-react";
import { api } from "../../api.js";
import { C } from "../../App.jsx";
import CustomSelect from "../CustomSelect.jsx";
import { ListRow, StatusPill, Button, Modal, FieldLabel, EmptyState, LoadingState } from "../ui.jsx";

const money = (n) => "TZS " + Number(n || 0).toLocaleString();

// Original Expenses.jsx, exactly — only the outer PageHeader was removed.
export default function ExpensesTab() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "", amount: "", note: "" });
  const [open, setOpen] = useState(false);

  const load = () => Promise.all([api.getExpenses(), api.getCategories("expense")]).then(([e, c]) => { setExpenses(e); setCategories(c); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e) => { e.preventDefault(); await api.addExpense({ ...form, amount: Number(form.amount) }); setForm({ category: "", amount: "", note: "" }); setOpen(false); load(); };
  const decide = async (id, status) => { await api.decideExpense(id, status); load(); };

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div style={{ color: C.textSoft }} className="text-xs">{expenses.length} logged</div>
        <Button onClick={() => setOpen(true)}><span className="flex items-center gap-1.5"><Plus size={16} />Log expense</span></Button>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl"><EmptyState icon={Wallet} title="No expenses yet" body="Log your first expense to start tracking spend." /></div>
      ) : (
        <div className="flex flex-col gap-2">
          {expenses.map((e) => {
            const tone = e.status === "Approved" ? "success" : e.status === "Rejected" ? "danger" : "amber";
            return (
              <ListRow
                key={e.id}
                icon={Wallet}
                tone={tone}
                title={money(e.amount) + " — " + e.category}
                subtitle={e.note + " · " + new Date(e.expense_date).toLocaleDateString()}
                trailing={
                  e.status === "Pending Approval" ? (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <StatusPill label="Pending" tone="amber" />
                      <button onClick={() => decide(e.id, "Approved")} className="text-xs font-semibold" style={{ color: C.cyan }}>Approve</button>
                      <button onClick={() => decide(e.id, "Rejected")} className="text-xs font-semibold" style={{ color: C.danger }}>Reject</button>
                    </div>
                  ) : (
                    <StatusPill label={e.status} tone={tone} />
                  )
                }
              />
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Log expense</div>
          <FieldLabel>Category</FieldLabel>
          <div className="mb-3">
            <CustomSelect required value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={categories.map((c) => ({ value: c.name, label: c.name }))} />
          </div>
          <FieldLabel>Amount (TZS)</FieldLabel>
          <input required type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Note</FieldLabel>
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
