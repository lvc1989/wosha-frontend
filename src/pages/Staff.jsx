import React, { useState, useEffect } from "react";
import { api } from "../api.js";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626" };

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", role: "" });
  const [open, setOpen] = useState(false);

  const load = () => api.getStaff().then(setStaff).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e) => { e.preventDefault(); await api.addStaff(form); setForm({ name: "", role: "" }); setOpen(false); load(); };
  const deactivate = async (s) => { await api.updateStaff(s.id, { active: !s.active }); load(); };
  const remove = async (id) => { if (confirm("Permanently remove this staff member?")) { await api.removeStaff(id); load(); } };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Staff</h1>
        <button onClick={() => setOpen(true)} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Staff</button>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {staff.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No staff yet.</div>}
        {staff.map((s, i) => (
          <div key={s.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}`, opacity: s.active ? 1 : 0.5 }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{s.name}</div>
              <div style={{ color: C.textSoft }} className="text-xs">{s.role}</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => deactivate(s)} className="text-xs font-semibold" style={{ color: C.textSoft }}>{s.active ? "Deactivate" : "Reactivate"}</button>
              <button onClick={() => remove(s.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Add Staff</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Role</label>
            <input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Technician, Branch Manager" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
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
