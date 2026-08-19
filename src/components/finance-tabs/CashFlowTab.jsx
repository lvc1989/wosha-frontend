import React, { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";
import { api } from "../../api.js";
import { useUser, C } from "../../App.jsx";
import CustomSelect from "../CustomSelect.jsx";
import { ListRow, Button, Modal, FieldLabel, EmptyState, LoadingState } from "../ui.jsx";

const money = (n) => "TZS " + Number(n || 0).toLocaleString();

// Original CashFlow.jsx, exactly — only the outer PageHeader was removed.
export default function CashFlowTab() {
  const { user } = useUser();
  const canEdit = user?.role === "owner" || user?.role === "manager";
  const [summary, setSummary] = useState([]);
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "", direction: "out", amount: "", note: "" });
  const [open, setOpen] = useState(false);
  const [itemOptions, setItemOptions] = useState([]);
  const [itemChoice, setItemChoice] = useState("");
  const [customItem, setCustomItem] = useState("");

  const load = () => Promise.all([api.getCashSummary(), api.getCashEntries(), api.getCategories("cashflow")]).then(([s, e, c]) => { setSummary(s); setEntries(e); setCategories(c); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!form.category) { setItemOptions([]); return; }
    api.getCashflowItems(form.category).then(setItemOptions);
  }, [form.category]);

  const submit = async (e) => {
    e.preventDefault();
    let item = itemChoice === "__other__" ? customItem.trim() : itemChoice;
    if (itemChoice === "__other__" && item) await api.addCashflowItem(form.category, item).catch(() => {});
    await api.addCashEntry({ ...form, item: item || undefined, amount: Number(form.amount) });
    setForm({ category: "", direction: "out", amount: "", note: "" });
    setItemChoice(""); setCustomItem("");
    setOpen(false);
    load();
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div style={{ color: C.textSoft }} className="text-xs">By branch, including invoices and expenses</div>
        {canEdit && <Button onClick={() => setOpen(true)}><span className="flex items-center gap-1.5"><Plus size={16} />Add entry</span></Button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {summary.map((s) => {
          const netPositive = Number(s.net) >= 0;
          return (
            <div key={s.location_id} style={{ background: C.tileBg || C.cyan }} className="relative overflow-hidden rounded-2xl p-4">
              <div style={{ background: `${C.tileText || "#FFFFFF"}${Math.round(C.heroBubbleOpacity * 255).toString(16).padStart(2, "0")}` }} className="wosha-hero-bubble-1 absolute -right-4 -top-6 w-24 h-24 rounded-full" />
              <div style={{ color: C.tileText || "#fff", fontFamily: "'Space Grotesk', sans-serif" }} className="relative text-sm font-semibold mb-3">{s.name}</div>
              <div className="relative flex justify-between text-xs mb-1.5 items-center">
                <span style={{ color: C.tileText ? `${C.tileText}BF` : "rgba(255,255,255,0.75)" }}>In</span>
                <span style={{ color: C.tileText || "#fff", fontFamily: "'IBM Plex Mono', monospace", fontSize: C.tileFontSize ? `${C.tileFontSize * 0.6}px` : undefined }}>{money(s.cash_in)}</span>
              </div>
              <div className="relative flex justify-between text-xs mb-1.5 items-center">
                <span style={{ color: C.tileText ? `${C.tileText}BF` : "rgba(255,255,255,0.75)" }}>Out</span>
                <span style={{ color: C.tileText || "#fff", fontFamily: "'IBM Plex Mono', monospace", fontSize: C.tileFontSize ? `${C.tileFontSize * 0.6}px` : undefined }}>{money(s.cash_out)}</span>
              </div>
              <div className="relative flex justify-between text-base font-bold mt-2 pt-2" style={{ borderTop: `1px solid ${C.tileText ? C.tileText + "40" : "rgba(255,255,255,0.25)"}` }}>
                <span style={{ color: C.tileText || "#fff" }}>Net</span>
                <span style={{ color: C.tileText ? C.tileText : (netPositive ? "#fff" : "#FFD5D5"), fontFamily: "'IBM Plex Mono', monospace", fontSize: C.tileFontSize ? `${C.tileFontSize * 0.7}px` : undefined }}>{money(s.net)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Manual entries</div>
      {entries.length === 0 ? (
        <div className="bg-white rounded-xl"><EmptyState icon={Wallet} title="No manual entries" body="Invoices and expenses already flow in automatically above." /></div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <ListRow
              key={e.id}
              icon={e.direction === "in" ? ArrowDownRight : ArrowUpRight}
              tone={e.direction === "in" ? "success" : "danger"}
              title={e.category + (e.item ? " — " + e.item : "")}
              subtitle={e.note}
              trailing={<span style={{ color: e.direction === "in" ? "#185FA5" : C.danger, fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm font-semibold">{e.direction === "in" ? "+" : "-"}{money(e.amount)}</span>}
            />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Add cash entry</div>
          <FieldLabel>Category</FieldLabel>
          <div className="mb-3">
            <CustomSelect required value={form.category} onChange={(v) => { setForm({ ...form, category: v }); setItemChoice(""); setCustomItem(""); }} options={categories.map((c) => ({ value: c.name, label: c.name }))} />
          </div>
          {form.category && (
            <>
              <FieldLabel>Item (optional)</FieldLabel>
              <div className="mb-3">
                <CustomSelect value={itemChoice} onChange={setItemChoice} placeholder="Choose an item…" options={[...itemOptions.map((i) => ({ value: i.name, label: i.name })), { value: "__other__", label: "Other (type your own)" }]} />
              </div>
              {itemChoice === "__other__" && (
                <input required value={customItem} onChange={(e) => setCustomItem(e.target.value)} placeholder="e.g. Data Bundle Allowance" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
              )}
            </>
          )}
          <FieldLabel>Direction</FieldLabel>
          <div className="mb-3">
            <CustomSelect value={form.direction} onChange={(v) => setForm({ ...form, direction: v })} options={[{ value: "in", label: "Money in" }, { value: "out", label: "Money out" }]} />
          </div>
          <FieldLabel>Amount (TZS)</FieldLabel>
          <input required type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
