import React, { useState, useEffect } from "react";
import { api } from "../../api.js";
import { useBranch, useUser, C } from "../../App.jsx";
import CustomSelect from "../CustomSelect.jsx";
import { X, Users, Plus } from "lucide-react";
import PasswordInput from "../PasswordInput.jsx";
import { ListRow, StatusPill, Button, Modal, FieldLabel, EmptyState, LoadingState } from "../ui.jsx";

const money = (n) => "TZS " + Math.round(Number(n || 0)).toLocaleString();
const ROLES = ["Branch Manager", "General Manager", "Supervisor / Cashier", "Technician", "Bay Attendant / Washer", "Detailing & Vacuum Specialist", "Security Guard", "Shop & Office Attendant"];
const blank = { name: "", role: "", locationId: "", salary: "", skills: "", username: "", password: "" };

export default function StaffTab() {
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

  if (loading) return <LoadingState />;

  const grossTotal = staff.filter((s) => s.active).reduce((sum, s) => sum + Number(s.salary || 0), 0);
  const activeRates = payrollRates.filter((r) => r.enabled);
  const rateAmounts = activeRates.map((r) => ({ ...r, amount: grossTotal * (Number(r.rate_percent) / 100) }));
  const employerTotal = grossTotal + rateAmounts.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div style={{ color: C.textSoft }} className="text-xs">{staff.length} total</div>
        <Button onClick={openAdd}><span className="flex items-center gap-1.5"><Plus size={16} />Add staff</span></Button>
      </div>

      {staff.length === 0 ? (
        <div className="bg-white rounded-xl mb-6"><EmptyState icon={Users} title="No staff yet" body="Add your first team member to get started." /></div>
      ) : (
        <div className="flex flex-col gap-2 mb-6">
          {staff.map((s) => (
            <div key={s.id} style={{ opacity: s.active ? 1 : 0.5 }}>
              <ListRow
                icon={Users}
                tone="cyan"
                title={s.name + (!s.active ? " (inactive)" : "")}
                subtitle={
                  s.role + " · " + locName(s.location_id) + (s.salary ? " · " + money(s.salary) + "/mo" : "") +
                  " · " + (s.login_username ? "Login: " + s.login_username + (s.login_active === false ? " (locked)" : "") : "No login account") +
                  ((s.skills || []).length > 0 ? " · " + s.skills.join(", ") : "")
                }
                trailing={
                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <button onClick={() => openEdit(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>
                    {s.login_username
                      ? <button onClick={() => openReset(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Reset password</button>
                      : <button onClick={() => openCreateLogin(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Create login</button>}
                    <button onClick={() => deactivate(s)} className="text-xs font-semibold" style={{ color: C.textSoft }}>{s.active ? "Deactivate" : "Reactivate"}</button>
                    {user?.isPrimaryOwner && <button onClick={() => remove(s.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>}
                  </div>
                }
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <div style={{ color: C.ink }} className="text-sm font-semibold">Payroll summary (employer cost)</div>
        <button onClick={() => setRateOpen(true)} className="text-xs font-semibold" style={{ color: C.cyan }}>+ Add cost item</button>
      </div>
      <div className="bg-white rounded-2xl p-5 max-w-md mb-3">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span style={{ color: C.textSoft }}>Gross salaries</span><span style={{ color: C.ink, fontFamily: "'IBM Plex Mono', monospace" }} className="text-right">{money(grossTotal)}</span>
          {rateAmounts.map((r) => (
            <React.Fragment key={r.id}>
              <span style={{ color: C.textSoft }}>{r.name} ({r.rate_percent}%)</span>
              <span style={{ color: C.ink, fontFamily: "'IBM Plex Mono', monospace" }} className="text-right">{money(r.amount)}</span>
            </React.Fragment>
          ))}
          <span style={{ color: C.ink, borderTop: "1px solid " + C.border }} className="font-bold pt-2">Total employer cost</span>
          <span style={{ color: C.cyan, borderTop: "1px solid " + C.border, fontFamily: "'IBM Plex Mono', monospace" }} className="text-right font-bold pt-2">{money(employerTotal)}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden max-w-md mb-6">
        <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase px-4 pt-3 pb-1">All cost items — choose which apply</div>
        {payrollRates.map((r, i) => (
          <div key={r.id} className="flex items-center justify-between gap-2 px-4 py-2.5" style={{ borderTop: i === 0 ? "none" : "1px solid " + C.border }}>
            <span style={{ color: C.ink }} className="text-sm">{r.name} — {r.rate_percent}%</span>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusPill label={r.enabled ? "Included" : "Excluded"} tone={r.enabled ? "success" : "ink"} />
              <button onClick={() => toggleRate(r)} className="text-xs font-semibold" style={{ color: C.cyan }}>Toggle</button>
              <button onClick={() => removeRate(r.id)} className="text-xs" style={{ color: C.danger }}><X size={13} /></button>
            </div>
          </div>
        ))}
        {payrollRates.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No cost items yet.</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">{editing ? "Edit staff" : "Add staff"}</div>
          {error && <div style={{ background: "#FDE8E7", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
          <FieldLabel>Name</FieldLabel>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Role</FieldLabel>
          <div className="mb-3">
            <CustomSelect required value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={ROLES.map((r) => ({ value: r, label: r }))} />
          </div>
          <FieldLabel>Branch</FieldLabel>
          <div className="mb-3">
            <CustomSelect value={form.locationId} onChange={(v) => setForm({ ...form, locationId: v })} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
          </div>
          <FieldLabel>Monthly salary (TZS)</FieldLabel>
          <input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Skills (comma-separated)</FieldLabel>
          <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. Detailing, Ceramic Coating" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          {!editing && (
            <>
              <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-2 mt-2">Login access (optional)</div>
              <FieldLabel>Username</FieldLabel>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Leave blank for no login" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
              <FieldLabel>Password</FieldLabel>
              <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mb-4" />
            </>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!loginTarget} onClose={() => setLoginTarget(null)}>
        {loginTarget && (
          <form onSubmit={submitCreateLogin}>
            <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Create login for {loginTarget.name}</div>
            {error && <div style={{ background: "#FDE8E7", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
            <FieldLabel>Username</FieldLabel>
            <input required value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <FieldLabel>Password</FieldLabel>
            <PasswordInput required value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="mb-4" />
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setLoginTarget(null)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1">Create</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)}>
        {resetTarget && (
          <form onSubmit={submitReset}>
            <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Reset password for {resetTarget.name}</div>
            {error && <div style={{ background: "#FDE8E7", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
            <FieldLabel>New password</FieldLabel>
            <PasswordInput required value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} className="mb-4" />
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setResetTarget(null)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1">Reset</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={rateOpen} onClose={() => setRateOpen(false)}>
        <form onSubmit={submitRate}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Add payroll cost item</div>
          <FieldLabel>Name</FieldLabel>
          <input required value={rateForm.name} onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })} placeholder="e.g. Health Insurance" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Rate (% of gross salary)</FieldLabel>
          <input required type="number" step="0.01" value={rateForm.ratePercent} onChange={(e) => setRateForm({ ...rateForm, ratePercent: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setRateOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Add</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
