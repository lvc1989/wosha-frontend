import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useUser, useBranch } from "../App.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import { Pencil, X } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", cyanDeep: "#1745B3", amber: "#FFC93C", amberBg: "#FEF3C7", amberDeep: "#92400E", violet: "#1F2937", danger: "#DC2626", border: "#E4E7EC", textSoft: "#667085" };
const money = (n) => "TZS " + Math.round(Number(n || 0)).toLocaleString();
const DEFAULT_ORG_STRUCTURE = "Managing Director (Owner)\n  ↓\nGeneral Manager (oversees all branches)\n  ↓\nBranch Managers\n  ↓\nStaff / Technicians";

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderTop: `3px solid ${accent}` }} className="rounded-xl p-4">
      <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase tracking-wide mb-1">{label}</div>
      <div style={{ color: C.ink }} className="text-xl font-bold mb-1">{value}</div>
      {sub && <div style={{ color: C.textSoft }} className="text-xs">{sub}</div>}
    </div>
  );
}

export default function BusinessPlan() {
  const { user } = useUser();
  const isOwner = user?.role === "owner";
  const canEditTargets = user?.role === "owner" || user?.role === "manager";
  const { locations } = useBranch();
  const [branchTargets, setBranchTargets] = useState([]);
  const [btOpen, setBtOpen] = useState(false);
  const [btEditing, setBtEditing] = useState(null);
  const [btForm, setBtForm] = useState({ locationId: "", category: "", label: "", targetValue: "", unit: "", period: "Monthly" });
  const [btCategories, setBtCategories] = useState([]);
  const [targets, setTargets] = useState(null);
  const [budget, setBudget] = useState([]);
  const [summary, setSummary] = useState({ budgeted: 0, actual: 0, variance: 0 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [editTargets, setEditTargets] = useState(false);
  const [targetsForm, setTargetsForm] = useState(null);
  const [targetsError, setTargetsError] = useState("");

  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetEditing, setBudgetEditing] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ category: "", amount: "" });

  const [orgForm, setOrgForm] = useState({ mission: "", vision: "", orgStructure: "" });
  const [orgSaved, setOrgSaved] = useState("");

  const load = () => Promise.all([api.getProjectTargets(), api.getBudgetLines(), api.getBudgetSummary(), api.getSettings()])
    .then(([t, b, s, st]) => {
      setTargets(t); setBudget(b); setSummary(s);
      setOrgForm({ mission: st.mission || "", vision: st.vision || "", orgStructure: st.org_structure || DEFAULT_ORG_STRUCTURE });
    })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  useEffect(() => { api.getBranchTargets().then(setBranchTargets); api.getCategories("branch_target").then(setBtCategories); }, []);

  const reloadBranchTargets = () => api.getBranchTargets().then(setBranchTargets);
  const openBtAdd = () => { setBtEditing(null); setBtForm({ locationId: locations[0]?.id || "", category: "", label: "", targetValue: "", unit: "", period: "Monthly" }); setBtOpen(true); };
  const openBtEdit = (t) => { setBtEditing(t.id); setBtForm({ locationId: t.location_id, category: t.category, label: t.label, targetValue: t.target_value, unit: t.unit || "", period: t.period }); setBtOpen(true); };
  const saveBt = async (e) => {
    e.preventDefault();
    const payload = { ...btForm, targetValue: Number(btForm.targetValue) };
    if (btEditing) await api.updateBranchTarget(btEditing, payload);
    else await api.addBranchTarget(payload);
    setBtOpen(false);
    reloadBranchTargets();
  };
  const removeBt = async (id) => { await api.removeBranchTarget(id); reloadBranchTargets(); };

  const openEditTargets = () => { setTargetsForm(targets); setEditTargets(true); setTargetsError(""); };
  const saveTargets = async (e) => {
    e.preventDefault();
    setTargetsError("");
    try {
      await api.updateProjectTargets({
        totalInvestment: Number(targetsForm.total_investment),
        targetCarsPerWeek: Number(targetsForm.target_cars_per_week),
        breakEvenCarsPerWeek: Number(targetsForm.break_even_cars_per_week),
        paybackYears: Number(targetsForm.payback_years),
        year1NetProfitAfterTax: Number(targetsForm.year1_net_profit_after_tax),
      });
      setEditTargets(false);
      await load();
    } catch (err) {
      setTargetsError(err.message);
    }
  };

  const openBudgetAdd = () => { setBudgetEditing(null); setBudgetForm({ category: "", amount: "" }); setBudgetOpen(true); };
  const openBudgetEdit = (b) => { setBudgetEditing(b.id); setBudgetForm({ category: b.category, amount: b.amount }); setBudgetOpen(true); };
  const saveBudgetRow = async (e) => {
    e.preventDefault();
    if (!budgetForm.category || !budgetForm.amount) return;
    if (budgetEditing) await api.updateBudgetLine(budgetEditing, { category: budgetForm.category, amount: Number(budgetForm.amount) });
    else await api.addBudgetLine({ category: budgetForm.category, amount: Number(budgetForm.amount) });
    setBudgetOpen(false);
    load();
  };
  const removeBudgetRow = async (id) => { await api.removeBudgetLine(id); load(); };

  const saveOrg = async (e) => {
    e.preventDefault();
    await api.updateSettings({ mission: orgForm.mission, vision: orgForm.vision, orgStructure: orgForm.orgStructure });
    setOrgSaved("Saved.");
    setTimeout(() => setOrgSaved(""), 2000);
  };

  if (loading || !targets) return <div style={{ color: C.textSoft }}>Loading…</div>;

  const filteredBudget = budget.filter((b) => b.category.toLowerCase().includes(query.toLowerCase()));
  const totalBudget = budget.reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div>
      <h1 style={{ color: C.ink }} className="text-xl font-bold mb-4">Business Plan</h1>

      <div style={{ background: C.amberBg, color: C.amberDeep }} className="rounded-lg px-4 py-2 text-xs mb-6">
        Reference figures from the original pre-launch business plan and financial model. Everything below is editable — adjust it as real numbers replace the original plan.
      </div>

      <div className="flex items-center justify-between mb-2">
        <div style={{ color: C.ink }} className="text-sm font-semibold">Project & targets</div>
        {isOwner && <button onClick={openEditTargets} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.cyan }}><Pencil size={12} /> Edit Targets</button>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Project Investment" value={money(targets.total_investment)} sub="Construction + equipment + fees" accent={C.violet} />
        <StatCard label="Target Capacity" value={`${targets.target_cars_per_week} cars/wk`} sub={`Break-even at ${targets.break_even_cars_per_week} cars/wk`} accent={C.cyan} />
        <StatCard label="Payback Period" value={`${targets.payback_years} years`} sub={`Year-1 net profit target ${money(targets.year1_net_profit_after_tax)}`} accent={C.amber} />
      </div>

      <div className="flex items-center justify-between mb-2">
        <div style={{ color: C.ink }} className="text-sm font-semibold">Branch targets{!isOwner && user?.locationId ? " — your branch" : ""}</div>
        {canEditTargets && <button onClick={openBtAdd} className="text-xs font-semibold" style={{ color: C.cyan }}>+ Add Target</button>}
      </div>
      <div style={{ color: C.textSoft }} className="text-xs mb-3">Specific, per-branch goals — e.g. "300 cars washed this month" for one branch. {isOwner ? "You see every branch's targets here." : "You see your own branch's targets."}</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden mb-6">
        {branchTargets.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No branch targets set yet.</div>}
        {branchTargets.map((t, i) => (
          <div key={t.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{t.label}</div>
              <div style={{ color: C.textSoft }} className="text-xs">{t.location_name} · {t.category} · Target: {Number(t.target_value).toLocaleString()} {t.unit} / {t.period}</div>
            </div>
            {canEditTargets && (
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => openBtEdit(t)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>
                <button onClick={() => removeBt(t.id)} className="text-xs font-semibold" style={{ color: "#DC2626" }}>Remove</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <div style={{ color: C.ink }} className="text-sm font-semibold">Monthly operating budget vs. actual expenses logged</div>
        {isOwner && <button onClick={openBudgetAdd} className="text-xs font-semibold" style={{ color: C.cyan }}>+ Add Line Item</button>}
      </div>
      <input placeholder="Filter budget lines…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden mb-3">
        {filteredBudget.map((b, i) => (
          <div key={b.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">{b.category}</span>
            <div className="flex items-center gap-3 flex-wrap">
              <span style={{ color: C.textSoft, fontFamily: "monospace" }} className="text-sm">{money(b.amount)}/mo</span>
              {isOwner && <button onClick={() => openBudgetEdit(b)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>}
              {isOwner && <button onClick={() => removeBudgetRow(b.id)} className="text-xs" style={{ color: C.danger }}><X size={13} /></button>}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${C.border}`, background: "#F5F7FA" }}>
          <span style={{ color: C.ink }} className="text-sm font-bold">Total budgeted</span>
          <span style={{ color: C.ink, fontFamily: "monospace" }} className="text-sm font-bold">{money(totalBudget)}/mo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <StatCard label="Budgeted" value={money(summary.budgeted)} accent={C.violet} />
        <StatCard label="Actual (logged expenses)" value={money(summary.actual)} accent={C.danger} />
        <StatCard label="Variance" value={money(summary.variance)} sub={summary.variance >= 0 ? "Under budget" : "Over budget"} accent={summary.variance >= 0 ? C.cyanDeep : C.danger} />
      </div>
      <div style={{ color: C.textSoft }} className="text-xs mb-6">
        The plan's one-time pre-launch construction costs are a reference for the build, not day-to-day data — this operating budget above is what actually feeds the live system.
      </div>

      <form onSubmit={saveOrg} style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6">
        <div style={{ color: C.ink }} className="text-sm font-bold mb-4">Mission, Vision & Organization Structure</div>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Mission</label>
        <textarea disabled={!isOwner} rows={2} value={orgForm.mission} onChange={(e) => setOrgForm({ ...orgForm, mission: e.target.value })} placeholder="What the business exists to do, day to day." style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm disabled:opacity-60" />
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Vision</label>
        <textarea disabled={!isOwner} rows={2} value={orgForm.vision} onChange={(e) => setOrgForm({ ...orgForm, vision: e.target.value })} placeholder="Where the business is headed long-term." style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm disabled:opacity-60" />
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Organization Structure</label>
        <textarea disabled={!isOwner} rows={6} value={orgForm.orgStructure} onChange={(e) => setOrgForm({ ...orgForm, orgStructure: e.target.value })} style={{ borderColor: C.border, fontFamily: "monospace" }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm disabled:opacity-60" />
        {isOwner && (
          <div className="flex items-center gap-3 flex-wrap">
            <button type="submit" style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">Save</button>
            {orgSaved && <span style={{ color: "#166534" }} className="text-xs">{orgSaved}</span>}
          </div>
        )}
      </form>

      {editTargets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={saveTargets} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Edit Business Plan Targets</div>
            {targetsError && <div style={{ background: "#FEE2E2", color: "#DC2626" }} className="rounded-lg px-3 py-2 text-xs mb-3">{targetsError}</div>}
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Total project investment (TZS)</label>
            <input type="number" value={targetsForm.total_investment} onChange={(e) => setTargetsForm({ ...targetsForm, total_investment: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Target cars/week</label>
                <input type="number" value={targetsForm.target_cars_per_week} onChange={(e) => setTargetsForm({ ...targetsForm, target_cars_per_week: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Break-even cars/week</label>
                <input type="number" value={targetsForm.break_even_cars_per_week} onChange={(e) => setTargetsForm({ ...targetsForm, break_even_cars_per_week: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Payback (years)</label>
                <input type="number" value={targetsForm.payback_years} onChange={(e) => setTargetsForm({ ...targetsForm, payback_years: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Year-1 net profit target (TZS)</label>
                <input type="number" value={targetsForm.year1_net_profit_after_tax} onChange={(e) => setTargetsForm({ ...targetsForm, year1_net_profit_after_tax: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditTargets(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Save Targets</button>
            </div>
          </form>
        </div>
      )}

      {budgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={saveBudgetRow} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">{budgetEditing ? "Edit Line Item" : "Add Line Item"}</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Category</label>
            <input required value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Monthly amount (TZS)</label>
            <input required type="number" value={budgetForm.amount} onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setBudgetOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">{budgetEditing ? "Save Changes" : "Add Line Item"}</button>
            </div>
          </form>
        </div>
      )}

      {btOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={saveBt} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">{btEditing ? "Edit Branch Target" : "Add Branch Target"}</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Branch</label>
            <div className="mb-3">
              <CustomSelect required value={btForm.locationId} onChange={(v) => setBtForm({ ...btForm, locationId: v })} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Category</label>
            <div className="mb-3">
              <CustomSelect required value={btForm.category} onChange={(v) => setBtForm({ ...btForm, category: v })} placeholder="Choose… (manage categories in Settings)" options={btCategories.map((c) => ({ value: c.name, label: c.name }))} />
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Label</label>
            <input required value={btForm.label} onChange={(e) => setBtForm({ ...btForm, label: e.target.value })} placeholder="e.g. Wash 300 cars this month" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Target value</label>
                <input required type="number" value={btForm.targetValue} onChange={(e) => setBtForm({ ...btForm, targetValue: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Unit</label>
                <input value={btForm.unit} onChange={(e) => setBtForm({ ...btForm, unit: e.target.value })} placeholder="e.g. cars, TZS" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Period</label>
            <div className="mb-4">
              <CustomSelect value={btForm.period} onChange={(v) => setBtForm({ ...btForm, period: v })} options={["Weekly", "Monthly", "Quarterly", "Yearly"].map((p) => ({ value: p, label: p }))} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setBtOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">{btEditing ? "Save Changes" : "Add Target"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
