import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useBranch, useUser } from "../App.jsx";
import CustomSelect from "../components/CustomSelect.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", amberBg: "#FEF3C7" };
const STATUS_COLORS = { Requested: { bg: "#F1F2F4", fg: "#667085" }, Confirmed: { bg: "#EEF2FF", fg: "#1745B3" }, "Checked-in": { bg: "#FEF3C7", fg: "#92400E" }, "In Progress": { bg: "#FEF3C7", fg: "#B45309" }, Completed: { bg: "#E6F4EA", fg: "#166534" }, Paid: { bg: "#E6F4EA", fg: "#166534" }, Closed: { bg: "#F1F2F4", fg: "#667085" }, Open: { bg: "#F1F2F4", fg: "#667085" }, Done: { bg: "#E6F4EA", fg: "#166534" } };

export default function JobBoard() {
  const { loc, locations } = useBranch();
  const { user } = useUser();
  const canManage = user?.role === "owner" || user?.role === "manager";
  const [bookings, setBookings] = useState([]);
  const [manualJobs, setManualJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const blankForm = { title: "", locationId: loc !== "all" ? loc : (locations[0]?.id || ""), technicianId: "", dueTime: "", notes: "" };
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");

  const load = () => Promise.all([api.getBookings(loc), api.getManualJobs(loc), api.getCustomers(), api.getStaff(), api.getServices()])
    .then(([b, mj, c, s, sv]) => { setBookings(b); setManualJobs(mj); setCustomers(c); setStaff(s); setServices(sv); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, [loc]);

  const custName = (id) => customers.find((c) => c.id === id)?.name || "—";
  const serviceNames = (ids) => (ids || []).map((id) => services.find((s) => s.id === id)?.name).filter(Boolean).join(", ") || "—";
  const advance = async (id) => { await api.advanceBooking(id); load(); };
  const advanceJob = async (id) => { await api.advanceManualJob(id); load(); };
  const reassignBooking = async (id, technicianId) => { await api.updateBooking(id, { technicianId }); load(); };
  const reassignJob = async (id, technicianId) => { await api.reassignManualJob(id, technicianId); load(); };

  const openCreate = () => { setError(""); setForm({ ...blankForm, locationId: loc !== "all" ? loc : (locations[0]?.id || "") }); setOpen(true); };
  const createJob = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.technicianId) { setError("Job title and an assigned staff member are required."); return; }
    await api.addManualJob(form);
    setOpen(false);
    load();
  };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  const activeStaff = staff.filter((s) => s.active !== false && (loc === "all" || s.location_id === loc));
  const staffForBranch = (locationId) => staff.filter((s) => s.location_id === locationId && s.active !== false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Job Board — by staff member</h1>
        {canManage && <button onClick={openCreate} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Create Job</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeStaff.map((t) => {
          const jobs = bookings.filter((b) => b.technician_id === t.id && b.status !== "Closed");
          const extraJobs = manualJobs.filter((j) => j.technician_id === t.id && j.status !== "Done");
          return (
            <div key={t.id} style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-4">
              <div style={{ color: C.ink }} className="text-sm font-bold mb-3">{t.name} <span style={{ color: C.textSoft, fontWeight: 400 }}>· {t.role}</span></div>
              <div className="flex flex-col gap-2">
                {jobs.length === 0 && extraJobs.length === 0 && <div style={{ color: C.textSoft }} className="text-xs">No active jobs.</div>}
                {jobs.map((b) => {
                  const sc = STATUS_COLORS[b.status] || STATUS_COLORS.Requested;
                  return (
                    <div key={b.id} style={{ background: "#F5F7FA" }} className="rounded-lg p-3">
                      <div style={{ color: C.ink }} className="text-xs font-semibold">{custName(b.customer_id)}</div>
                      <div style={{ color: C.textSoft }} className="text-xs mb-2">{serviceNames(b.service_ids)}</div>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ background: sc.bg, color: sc.fg }} className="text-xs font-medium px-2 py-0.5 rounded-full">{b.status}</span>
                        {b.status !== "Closed" && <button onClick={() => advance(b.id)} style={{ color: C.cyan }} className="text-xs font-semibold">Advance →</button>}
                      </div>
                      {canManage && (
                        <CustomSelect value={b.technician_id || ""} onChange={(v) => reassignBooking(b.id, v)} options={staffForBranch(b.location_id).map((s) => ({ value: s.id, label: s.name }))} className="w-full text-xs border rounded px-2 py-1 text-left flex items-center justify-between" style={{ borderColor: C.border }} />
                      )}
                    </div>
                  );
                })}
                {extraJobs.map((j) => {
                  const sc = STATUS_COLORS[j.status] || STATUS_COLORS.Open;
                  return (
                    <div key={j.id} style={{ background: C.amberBg }} className="rounded-lg p-3">
                      <div style={{ color: C.ink }} className="text-xs font-semibold">{j.title}</div>
                      <div style={{ color: C.textSoft }} className="text-xs mb-2">{j.notes}{j.due_time ? ` · due ${j.due_time}` : ""}</div>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ background: sc.bg, color: sc.fg }} className="text-xs font-medium px-2 py-0.5 rounded-full">{j.status}</span>
                        {j.status !== "Done" && <button onClick={() => advanceJob(j.id)} style={{ color: C.cyan }} className="text-xs font-semibold">Advance →</button>}
                      </div>
                      {canManage && (
                        <CustomSelect value={j.technician_id || ""} onChange={(v) => reassignJob(j.id, v)} options={staffForBranch(j.location_id).map((s) => ({ value: s.id, label: s.name }))} className="w-full text-xs border rounded px-2 py-1 text-left flex items-center justify-between" style={{ borderColor: C.border }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {activeStaff.length === 0 && <div style={{ color: C.textSoft }} className="text-sm">No active staff for this view.</div>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={createJob} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Create Job</div>
            {error && <div style={{ background: "#FEE2E2", color: "#DC2626" }} className="rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Job title / task</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Restock bay 2, deep-clean waiting area…" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Branch</label>
            <div className="mb-3">
              <CustomSelect value={form.locationId} onChange={(v) => setForm({ ...form, locationId: v, technicianId: "" })} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Assign to</label>
            <div className="mb-3">
              <CustomSelect required value={form.technicianId} onChange={(v) => setForm({ ...form, technicianId: v })} options={staffForBranch(form.locationId).map((s) => ({ value: s.id, label: `${s.name} · ${s.role}` }))} />
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Due time (optional)</label>
            <input value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} placeholder="e.g. 2:00 PM" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Notes</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Assign Job</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
