import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { api } from "../api.js";
import { useBranch, useUser, C } from "../App.jsx";
import { PageHeader, StatusPill, Button, Modal, FieldLabel, LoadingState } from "../components/ui.jsx";
import CustomSelect from "../components/CustomSelect.jsx";

const STATUS_TONE = {
  Requested: "ink", Confirmed: "cyan", "Checked-in": "amber", "In Progress": "amber",
  Completed: "success", Paid: "success", Closed: "ink", Open: "ink", Done: "success",
};

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

  if (loading) return <LoadingState />;

  const activeStaff = staff.filter((s) => s.active !== false && (loc === "all" || s.location_id === loc));
  const staffForBranch = (locationId) => staff.filter((s) => s.location_id === locationId && s.active !== false);

  return (
    <div>
      <PageHeader
        title="Job board"
        subtitle="Organized by staff member"
        action={canManage && <Button onClick={openCreate}><span className="flex items-center gap-1.5"><Plus size={16} />Create job</span></Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeStaff.map((t) => {
          const jobs = bookings.filter((b) => b.technician_id === t.id && b.status !== "Closed");
          const extraJobs = manualJobs.filter((j) => j.technician_id === t.id && j.status !== "Done");
          return (
            <div key={t.id} className="bg-white rounded-2xl p-4">
              <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-sm font-semibold mb-3">{t.name} <span style={{ color: C.textSoft, fontFamily: "'Inter', sans-serif", fontWeight: 400 }}>· {t.role}</span></div>
              <div className="flex flex-col gap-2">
                {jobs.length === 0 && extraJobs.length === 0 && <div style={{ color: C.textSoft }} className="text-xs">No active jobs.</div>}
                {jobs.map((b) => {
                  const tone = STATUS_TONE[b.status] || "ink";
                  return (
                    <div key={b.id} style={{ background: "#F5F7FA", borderLeft: "3px solid " + (tone === "amber" ? "#EF9F27" : tone === "success" ? "#639922" : C.cyan) }} className="rounded-r-lg p-3">
                      <div style={{ color: C.ink }} className="text-xs font-semibold">{custName(b.customer_id)}</div>
                      <div style={{ color: C.textSoft }} className="text-xs mb-2">{serviceNames(b.service_ids)}</div>
                      <div className="flex items-center justify-between mb-2">
                        <StatusPill label={b.status} tone={tone} />
                        {b.status !== "Closed" && <button onClick={() => advance(b.id)} style={{ color: C.cyan }} className="text-xs font-semibold">Advance →</button>}
                      </div>
                      {canManage && (
                        <CustomSelect value={b.technician_id || ""} onChange={(v) => reassignBooking(b.id, v)} options={staffForBranch(b.location_id).map((s) => ({ value: s.id, label: s.name }))} className="w-full text-xs border rounded px-2 py-1 text-left flex items-center justify-between" style={{ borderColor: C.border }} />
                      )}
                    </div>
                  );
                })}
                {extraJobs.map((j) => {
                  const tone = STATUS_TONE[j.status] || "amber";
                  return (
                    <div key={j.id} style={{ background: "#FAEEDA", borderLeft: "3px solid #EF9F27" }} className="rounded-r-lg p-3">
                      <div style={{ color: C.ink }} className="text-xs font-semibold">{j.title}</div>
                      <div style={{ color: C.textSoft }} className="text-xs mb-2">{j.notes}{j.due_time ? " · due " + j.due_time : ""}</div>
                      <div className="flex items-center justify-between mb-2">
                        <StatusPill label={j.status} tone={tone} />
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

      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={createJob}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Create job</div>
          {error && <div style={{ background: "#FDE8E7", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-3">{error}</div>}
          <FieldLabel>Job title / task</FieldLabel>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Restock bay 2, deep-clean waiting area…" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Branch</FieldLabel>
          <div className="mb-3">
            <CustomSelect value={form.locationId} onChange={(v) => setForm({ ...form, locationId: v, technicianId: "" })} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
          </div>
          <FieldLabel>Assign to</FieldLabel>
          <div className="mb-3">
            <CustomSelect required value={form.technicianId} onChange={(v) => setForm({ ...form, technicianId: v })} options={staffForBranch(form.locationId).map((s) => ({ value: s.id, label: s.name + " · " + s.role }))} />
          </div>
          <FieldLabel>Due time (optional)</FieldLabel>
          <input value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} placeholder="e.g. 2:00 PM" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Notes</FieldLabel>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Assign job</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
