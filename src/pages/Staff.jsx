import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useBranch, useUser } from "../App.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import { X } from "lucide-react";
import PasswordInput from "../components/PasswordInput.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626", successBg: "#E6F4EA" };
const money = (n) => "TZS " + Math.round(Number(n || 0)).toLocaleString();
const ROLES = ["Branch Manager", "General Manager", "Supervisor / Cashier", "Technician", "Bay Attendant / Washer", "Detailing & Vacuum Specialist", "Security Guard", "Shop & Office Attendant"];
const blank = { name: "", role: "", locationId: "", salary: "", skills: "", username: "", password: "" };

export default function Staff() {
  const { locations } = useBranch();
  const { user } = useUser();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loginTarget, setLoginTarget] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [payrollRates, setPayrollRates] = useState([]);
  const [rateForm, setRateForm] = useState({ name: "", ratePercent: "" });
  const [rateOpen, setRateOpen] = useState(false);

  const load = () => api.getStaff().then(setStaff).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  useEffect(() => { api.getPayrollRates().then(setPayrollRates); }, []);

  const toggleRate = async (r) => { await api.updatePayrollRate(r.id, { enabled: !r.enabled }); api.getPayrollRates().then(setPayrollRates); };
  const removeRate = async (id) => { await api.removePayrollRate(id); api.getPayrollRates().then(setPayrollRates); };
  const submitRate = async (e) => {
    e.preventDefault();
    if (!rateForm.name.trim() || rateForm.ratePercent === "") return;
    await api.addPayrollRate({ name: rateForm.name, ratePercent: Number(rateForm.ratePercent) });
    setRateForm({ name: "", ratePercent: "" });
    setRateOpen(false);
    api.getPayrollRates().then(setPayrollRates);
  };

  const openAdd = () => { setEditing(null); setError(""); setForm({ ...blank, locationId: locations[0]?.id || "" }); setOpen(true); };
  const openEdit = (s) => {
    setEditing(s.id);
    setError("");
    setForm({ name: s.name, role: s.role, locationId: s.location_id || "", salary: s.salary || "", skills: (s.skills || []).join(", "), username: "", password: "" });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = { name: form.name, role: form.role, locationId: form.locationId, salary: Number(form.salary) || 0, skills: form.skills.split(",").map((x) => x.trim()).filter(Boolean) };
    try {
      if (editing) {
        await api.updateStaff(editing, payload);
      } else {
        if (form.username && form.password) { payload.username = form.username; payload.password = form.password; }
        await api.addStaff(payload);
      }
      setOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deactivate = async (s) => { await api.updateStaff(s.id, { active: !s.active }); load(); };
  const remove = async (id) => { if (confirm("Permanently remove this staff member? This also deletes their login if they have one.")) { await api.removeStaff(id); load(); } };
  const locName = (id) => locations.find((l) => l.id === id)?.name || "—";

  const openCreateLogin = (s) => { setLoginTarget(s); setLoginForm({ username: "", password: "" }); setError(""); };
  const submitCreateLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.createStaffLogin(loginTarget.id, loginForm.username, loginForm.password);
      setLoginTarget(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openReset = (s) => { setResetTarget(s); setResetPassword(""); setError(""); };
  const submitReset = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.resetStaffPassword(resetTarget.id, resetPassword);
      setResetTarget(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  const grossTotal = staff.filter((s) => s.active).reduce((sum, s) => sum + Number(s.salary || 0), 0);
  const activeRates = payrollRates.filter((r) => r.enabled);
  const rateAmounts = activeRates.map((r) => ({ ...r, amount: grossTotal * (Number(r.rate_percent) / 100) }));
  const employerTotal = grossTotal + rateAmounts.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Staff</h1>
        <button onClick={openAdd} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Staff</button>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden mb-6">
        {staff.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No staff yet.</div>}
        {staff.map((s, i) => (
          <div key={s.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}`, opacity: s.active ? 1 : 0.5 }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{s.name}{!s.active && " (inactive)"}</div>
              <div style={{ color: C.textSoft }} className="text-xs">{s.role} · {locName(s.location_id)}{s.salary ? ` · ${money(s.salary)}/mo` : ""}</div>
              <div style={{ color: s.login_username ? "#166534" : C.textSoft }} className="text-xs mt-0.5">
                {s.login_username ? `Login: ${s.login_username}${s.login_active === false ? " (locked)" : ""}` : "No login account"}
              </div>
              {(s.skills || []).length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1">
                  {s.skills.map((sk) => <span key={sk} style={{ background: C.successBg, color: C.cyan }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full">{sk}</span>)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => openEdit(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>
              {s.login_username
                ? <button onClick={() => openReset(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Reset Password</button>
                : <button onClick={() => openCreateLogin(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Create Login</button>}
              <button onClick={() => deactivate(s)} className="text-xs font-semibold" style={{ color: C.textSoft }}>{s.active ? "Deactivate" : "Reactivate"}</button>
              {user?.isPrimaryOwner && <button onClick={() => remove(s.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <div style={{ color: C.ink }} className="text-sm font-semibold">Payroll summary (employer cost)</div>
        <button onClick={() => setRateOpen(true)} className="text-xs font-semibold" style={{ color: C.cyan }}>+ Add Cost Item</button>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-5 max-w-md mb-3">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span style={{ color: C.textSoft }}>Gross salaries</span><span style={{ color: C.ink, fontFamily: "monospace" }} className="text-right">{money(grossTotal)}</span>
          {rateAmounts.map((r) => (
            <React.Fragment key={r.id}>
              <span style={{ color: C.textSoft }}>{r.name} ({r.rate_percent}%)</span>
              <span style={{ color: C.ink, fontFamily: "monospace" }} className="text-right">{money(r.amount)}</span>
            </React.Fragment>
          ))}
          <span style={{ color: C.ink, borderTop: `1px solid ${C.border}` }} className="font-bold pt-2">Total employer cost</span>
          <span style={{ color: C.cyan, borderTop: `1px solid ${C.border}`, fontFamily: "monospace" }} className="text-right font-bold pt-2">{money(employerTotal)}</span>
        </div>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden max-w-md mb-6">
        <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase px-4 pt-3 pb-1">All cost items — choose which apply</div>
        {payrollRates.map((r, i) => (
          <div key={r.id} className="flex items-center justify-between gap-2 px-4 py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">{r.name} — {r.rate_percent}%</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => toggleRate(r)} style={{ background: r.enabled ? "#166534" : C.border, color: r.enabled ? "#fff" : C.textSoft }} className="text-xs font-semibold px-2.5 py-1 rounded-full">{r.enabled ? "Included" : "Excluded"}</button>
              <button onClick={() => removeRate(r.id)} className="text-xs" style={{ color: C.danger }}><X size={13} /></button>
            </div>
          </div>
        ))}
        {payrollRates.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No cost items yet.</div>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6 max-h-[85vh] overflow-y-auto">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">{editing ? "Edit Staff" : "Add Staff"}</div>
            {error && <div style={{ background: "#FEE2E2", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Role</label>
            <div className="mb-3">
              <CustomSelect required value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={ROLES.map((r) => ({ value: r, label: r }))} />
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Branch</label>
            <div className="mb-3">
              <CustomSelect value={form.locationId} onChange={(v) => setForm({ ...form, locationId: v })} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Monthly salary (TZS)</label>
            <input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Skills (comma-separated)</label>
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. Detailing, Ceramic Coating" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            {!editing && (
              <>
                <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-2 mt-2">Login access (optional)</div>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Username</label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Leave blank for no login" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Password</label>
                <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mb-4" />
              </>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Save</button>
            </div>
          </form>
        </div>
      )}

      {loginTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submitCreateLogin} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Create Login for {loginTarget.name}</div>
            {error && <div style={{ background: "#FEE2E2", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Username</label>
            <input required value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Password</label>
            <PasswordInput required value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="mb-4" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setLoginTarget(null)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Create</button>
            </div>
          </form>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submitReset} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Reset Password for {resetTarget.name}</div>
            {error && <div style={{ background: "#FEE2E2", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>New password</label>
            <PasswordInput required value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} className="mb-4" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setResetTarget(null)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Reset</button>
            </div>
          </form>
        </div>
      )}

      {rateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submitRate} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Add Payroll Cost Item</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Name</label>
            <input required value={rateForm.name} onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })} placeholder="e.g. Health Insurance" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Rate (% of gross salary)</label>
            <input required type="number" step="0.01" value={rateForm.ratePercent} onChange={(e) => setRateForm({ ...rateForm, ratePercent: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setRateOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Add</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
