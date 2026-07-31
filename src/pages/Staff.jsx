import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useBranch } from "../App.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626", successBg: "#E6F4EA" };
const money = (n) => "TZS " + Math.round(Number(n || 0)).toLocaleString();
const PAYROLL_RATES = { nssf: 0.10, sdl: 0.035, wcf: 0.006 }; // matches the original business plan's statutory employer rates
const blank = { name: "", role: "", locationId: "", salary: "", skills: "" };

export default function Staff() {
  const { locations } = useBranch();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => api.getStaff().then(setStaff).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ ...blank, locationId: locations[0]?.id || "" }); setOpen(true); };
  const openEdit = (s) => {
    setEditing(s.id);
    setForm({ name: s.name, role: s.role, locationId: s.location_id || "", salary: s.salary || "", skills: (s.skills || []).join(", ") });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { name: form.name, role: form.role, locationId: form.locationId, salary: Number(form.salary) || 0, skills: form.skills.split(",").map((x) => x.trim()).filter(Boolean) };
    if (editing) await api.updateStaff(editing, payload);
    else await api.addStaff(payload);
    setOpen(false);
    load();
  };

  const deactivate = async (s) => { await api.updateStaff(s.id, { active: !s.active }); load(); };
  const remove = async (id) => { if (confirm("Permanently remove this staff member?")) { await api.removeStaff(id); load(); } };
  const locName = (id) => locations.find((l) => l.id === id)?.name || "—";

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  const grossTotal = staff.filter((s) => s.active).reduce((sum, s) => sum + Number(s.salary || 0), 0);
  const nssf = grossTotal * PAYROLL_RATES.nssf, sdl = grossTotal * PAYROLL_RATES.sdl, wcf = grossTotal * PAYROLL_RATES.wcf;
  const employerTotal = grossTotal + nssf + sdl + wcf;

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
              {(s.skills || []).length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1">
                  {s.skills.map((sk) => <span key={sk} style={{ background: C.successBg, color: C.cyan }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full">{sk}</span>)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => openEdit(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>
              <button onClick={() => deactivate(s)} className="text-xs font-semibold" style={{ color: C.textSoft }}>{s.active ? "Deactivate" : "Reactivate"}</button>
              <button onClick={() => remove(s.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Payroll summary (employer cost)</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-5 max-w-md">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span style={{ color: C.textSoft }}>Gross salaries</span><span style={{ color: C.ink, fontFamily: "monospace" }} className="text-right">{money(grossTotal)}</span>
          <span style={{ color: C.textSoft }}>NSSF (10%, employer)</span><span style={{ color: C.ink, fontFamily: "monospace" }} className="text-right">{money(nssf)}</span>
          <span style={{ color: C.textSoft }}>SDL (3.5%)</span><span style={{ color: C.ink, fontFamily: "monospace" }} className="text-right">{money(sdl)}</span>
          <span style={{ color: C.textSoft }}>WCF (0.6%)</span><span style={{ color: C.ink, fontFamily: "monospace" }} className="text-right">{money(wcf)}</span>
          <span style={{ color: C.ink, borderTop: `1px solid ${C.border}` }} className="font-bold pt-2">Total employer cost</span>
          <span style={{ color: C.cyan, borderTop: `1px solid ${C.border}`, fontFamily: "monospace" }} className="text-right font-bold pt-2">{money(employerTotal)}</span>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">{editing ? "Edit Staff" : "Add Staff"}</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Role</label>
            <input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Technician, Branch Manager" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Branch</label>
            <select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Monthly salary (TZS)</label>
            <input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Skills (comma-separated)</label>
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. Detailing, Ceramic Coating" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
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
