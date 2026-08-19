import React, { useState, useEffect } from "react";
import { Calendar, Car, Bike, Plus, List, LayoutGrid } from "lucide-react";
import { api } from "../api.js";
import { useBranch, useUser, C } from "../App.jsx";
import { PageHeader, ListRow, StatusPill, Button, Modal, FieldLabel, EmptyState, LoadingState } from "../components/ui.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import CustomDatePicker from "../components/CustomDatePicker.jsx";

const money = (n) => "TZS " + Number(n || 0).toLocaleString();
const STATUS_TONE = {
  Requested: "ink", Confirmed: "cyan", "Checked-in": "amber", "In Progress": "amber",
  Completed: "success", Paid: "success", Closed: "ink", "No Show": "danger", Open: "ink", Done: "success",
};

export default function Bookings() {
  const { loc, locations } = useBranch();
  const { user } = useUser();
  const canManage = user?.role === "owner" || user?.role === "manager";

  const [view, setView] = useState("list");

  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [manualJobs, setManualJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const blankForm = { locationId: locations[0]?.id || "", customerId: "", vehiclePlate: "", serviceIds: [], technicianId: "", scheduledTime: "09:00" };
  const [form, setForm] = useState(blankForm);

  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [jobOpen, setJobOpen] = useState(false);
  const blankJobForm = { title: "", locationId: loc !== "all" ? loc : (locations[0]?.id || ""), technicianId: "", dueTime: "", notes: "" };
  const [jobForm, setJobForm] = useState(blankJobForm);
  const [jobError, setJobError] = useState("");

  const [staffViewBookings, setStaffViewBookings] = useState([]);
  const load = () => Promise.all([api.getBookingsPaged(loc, dateFrom, dateTo, 0), api.getCustomers(), api.getServices(), api.getStaff(), api.getManualJobs(loc), api.getBookings(loc)])
    .then(([b, c, s, st, mj, allB]) => { setBookings(b.rows); setTotal(b.total); setCustomers(c); setServices(s); setStaff(st); setManualJobs(mj); setStaffViewBookings(allB); })
    .finally(() => setLoading(false));
  useEffect(() => { setLoading(true); load(); }, [loc, dateFrom, dateTo]);

  const loadMore = async () => {
    setLoadingMore(true);
    const { rows } = await api.getBookingsPaged(loc, dateFrom, dateTo, bookings.length);
    setBookings((prev) => [...prev, ...rows]);
    setLoadingMore(false);
  };

  const custName = (id) => customers.find((c) => c.id === id)?.name || "—";
  const techName = (id) => staff.find((s) => s.id === id)?.name || "Unassigned";
  const serviceNames = (ids) => (ids || []).map((id) => services.find((s) => s.id === id)?.name).filter(Boolean).join(", ") || "—";
  const advance = async (id) => { await api.advanceBooking(id); load(); };
  const noShow = async (id) => { if (confirm("Mark this booking as a no-show?")) { await api.markBookingNoShow(id); load(); } };
  const removeFromList = async (id) => { await api.archiveBooking(id); load(); };
  const sendForReview = async (id) => { await api.sendBookingForReview(id); load(); };
  const ownerReview = async (id, decision) => {
    const note = decision === "Approved" ? "" : prompt("Note for the GM (why it needs " + (decision === "Rejected" ? "rejecting" : "improvement") + ")?") || "";
    await api.ownerReviewBooking(id, decision, note);
    load();
  };

  const openAdd = () => { setEditing(null); setForm({ ...blankForm, locationId: loc !== "all" ? loc : (locations[0]?.id || "") }); setOpen(true); };
  const openEdit = (b) => {
    setEditing(b.id);
    setForm({ locationId: b.location_id, customerId: b.customer_id, vehiclePlate: b.vehicle_plate || "", serviceIds: b.service_ids || [], technicianId: b.technician_id || "", scheduledTime: b.scheduled_time || "" });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.serviceIds.length) return;
    if (editing) await api.updateBooking(editing, form);
    else await api.addBooking(form);
    setOpen(false);
    load();
  };

  const toggleService = (id) => setForm((f) => ({ ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id] }));

  const advanceJob = async (id) => { await api.advanceManualJob(id); load(); };
  const reassignBooking = async (id, technicianId) => { await api.updateBooking(id, { technicianId }); load(); };
  const reassignJob = async (id, technicianId) => { await api.reassignManualJob(id, technicianId); load(); };
  const staffForBranch = (locationId) => staff.filter((s) => s.location_id === locationId && s.active !== false);
  const openCreateJob = () => { setJobError(""); setJobForm({ ...blankJobForm, locationId: loc !== "all" ? loc : (locations[0]?.id || "") }); setJobOpen(true); };
  const createJob = async (e) => {
    e.preventDefault();
    if (!jobForm.title.trim() || !jobForm.technicianId) { setJobError("Job title and an assigned staff member are required."); return; }
    await api.addManualJob(jobForm);
    setJobOpen(false);
    load();
  };

  if (loading) return <LoadingState />;

  const activeStaff = staff.filter((s) => s.active !== false && (loc === "all" || s.location_id === loc));

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle={view === "list" ? "Showing " + bookings.length + " of " + total + (!dateFrom && !dateTo ? " · most recent" : "") : "Organized by staff member"}
        action={
          view === "list"
            ? <Button onClick={openAdd}><span className="flex items-center gap-1.5"><Plus size={16} />New booking</span></Button>
            : (canManage && <Button onClick={openCreateJob}><span className="flex items-center gap-1.5"><Plus size={16} />Create job</span></Button>)
        }
      />

      <div className="flex items-center gap-1 mb-4 bg-white rounded-lg p-1 w-fit">
        <button onClick={() => setView("list")} style={{ background: view === "list" ? C.cyan : "transparent", color: view === "list" ? "#fff" : C.textSoft }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md">
          <List size={14} /> List
        </button>
        <button onClick={() => setView("staff")} style={{ background: view === "staff" ? C.cyan : "transparent", color: view === "staff" ? "#fff" : C.textSoft }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md">
          <LayoutGrid size={14} /> By Staff
        </button>
      </div>

      {view === "list" ? (
        <>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <label style={{ color: C.textSoft }} className="text-xs font-semibold">From</label>
            <div style={{ width: 150 }}>
              <CustomDatePicker value={dateFrom} onChange={setDateFrom} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between gap-2" style={{ borderColor: C.border }} />
            </div>
            <label style={{ color: C.textSoft }} className="text-xs font-semibold">To</label>
            <div style={{ width: 150 }}>
              <CustomDatePicker value={dateTo} onChange={setDateTo} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between gap-2" style={{ borderColor: C.border }} />
            </div>
            {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs font-semibold" style={{ color: C.cyan }}>Clear</button>}
          </div>

          {bookings.length === 0 ? (
            <div className="bg-white rounded-xl">
              <EmptyState icon={Calendar} title="No bookings found" body="Try clearing the date filter, or create a new booking to get started." />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {bookings.map((b) => {
                const tone = STATUS_TONE[b.status] || "ink";
                const isFinished = ["Closed", "Paid", "No Show"].includes(b.status);
                const isBike = /boda|bike|motor/i.test(serviceNames(b.service_ids));
                return (
                  <ListRow
                    key={b.id}
                    icon={isBike ? Bike : Car}
                    tone={tone}
                    title={custName(b.customer_id) + " — " + (b.vehicle_plate || "no plate")}
                    subtitle={
                      serviceNames(b.service_ids) + " · " + techName(b.technician_id) + " · " + (b.scheduled_time || "unscheduled") +
                      (b.owner_review_status ? " · Owner review: " + b.owner_review_status + (b.review_note ? " — \"" + b.review_note + "\"" : "") : "")
                    }
                    trailing={
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <StatusPill label={b.status} tone={tone} />
                        {!isFinished && <button onClick={() => openEdit(b)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>}
                        {!isFinished && <button onClick={() => advance(b.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>Advance →</button>}
                        {!isFinished && <button onClick={() => noShow(b.id)} className="text-xs font-semibold" style={{ color: C.danger }}>No show</button>}
                        {b.status === "Completed" && !b.owner_review_status && <button onClick={() => sendForReview(b.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>Send for review</button>}
                        {user?.isPrimaryOwner && b.owner_review_status === "Needs Review" && (
                          <>
                            <button onClick={() => ownerReview(b.id, "Approved")} className="text-xs font-semibold" style={{ color: "#185FA5" }}>Approve</button>
                            <button onClick={() => ownerReview(b.id, "Needs Improvement")} className="text-xs font-semibold" style={{ color: "#854F0B" }}>Request changes</button>
                            <button onClick={() => ownerReview(b.id, "Rejected")} className="text-xs font-semibold" style={{ color: C.danger }}>Reject</button>
                          </>
                        )}
                        {isFinished && <button onClick={() => removeFromList(b.id)} className="text-xs font-semibold" style={{ color: C.textSoft }}>Remove</button>}
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}

          {bookings.length < total && (
            <div className="text-center mt-3">
              <Button variant="ghost" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Loading…" : "Load more"}</Button>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeStaff.map((t) => {
            const jobs = staffViewBookings.filter((b) => b.technician_id === t.id && b.status !== "Closed");
            const extraJobs = manualJobs.filter((j) => j.technician_id === t.id && j.status !== "Done");
            return (
              <div key={t.id} className="bg-white rounded-2xl p-4">
                <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-sm font-semibold mb-3">{t.name} <span style={{ color: C.textSoft, fontFamily: "'Inter', sans-serif", fontWeight: 400 }}>· {t.role}</span></div>
                <div className="flex flex-col gap-2">
                  {jobs.length === 0 && extraJobs.length === 0 && <div style={{ color: C.textSoft }} className="text-xs">No active jobs.</div>}
                  {jobs.map((b) => {
                    const tone = STATUS_TONE[b.status] || "ink";
                    return (
                      <div key={b.id} style={{ background: "#F5F7FA", borderLeft: "3px solid " + (tone === "amber" ? "#EF9F27" : tone === "success" ? "#2B6CF6" : C.cyan) }} className="rounded-r-lg p-3">
                        <div style={{ color: C.ink, wordBreak: "break-word" }} className="text-xs font-semibold">{custName(b.customer_id)}</div>
                        <div style={{ color: C.textSoft, wordBreak: "break-word" }} className="text-xs mb-2">{serviceNames(b.service_ids)}</div>
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
                        <div style={{ color: C.ink, wordBreak: "break-word" }} className="text-xs font-semibold">{j.title}</div>
                        <div style={{ color: C.textSoft, wordBreak: "break-word" }} className="text-xs mb-2">{j.notes}{j.due_time ? " · due " + j.due_time : ""}</div>
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
      )}

      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">{editing ? "Edit booking" : "New booking"}</div>

          <FieldLabel>Branch</FieldLabel>
          <div className="mb-3">
            <CustomSelect required value={form.locationId} onChange={(v) => setForm({ ...form, locationId: v })} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
          </div>

          <FieldLabel>Customer</FieldLabel>
          <div className="mb-3">
            <CustomSelect required value={form.customerId} onChange={(v) => setForm({ ...form, customerId: v })} options={customers.map((c) => ({ value: c.id, label: c.name }))} />
          </div>

          <FieldLabel>Vehicle plate</FieldLabel>
          <input value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} placeholder="T 123 ABC" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />

          <FieldLabel>Services</FieldLabel>
          <div style={{ borderColor: C.border }} className="border rounded-lg p-2 mb-3 max-h-32 overflow-y-auto flex flex-col gap-1">
            {services.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                {s.name} — {money(s.price)}
              </label>
            ))}
          </div>
          {!form.serviceIds.length && <div style={{ color: C.danger }} className="text-xs mb-2 -mt-2">Select at least one service.</div>}

          <FieldLabel>Technician</FieldLabel>
          <div className="mb-3">
            <CustomSelect value={form.technicianId} onChange={(v) => setForm({ ...form, technicianId: v })} placeholder="Unassigned" options={staff.filter((s) => s.location_id === form.locationId).map((s) => ({ value: s.id, label: s.name }))} />
          </div>

          <FieldLabel>Time</FieldLabel>
          <input type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editing ? "Save changes" : "Create booking"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={jobOpen} onClose={() => setJobOpen(false)}>
        <form onSubmit={createJob}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Create job</div>
          {jobError && <div style={{ background: "#FDE8E7", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-3">{jobError}</div>}
          <FieldLabel>Job title / task</FieldLabel>
          <input required value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="e.g. Restock bay 2, deep-clean waiting area…" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Branch</FieldLabel>
          <div className="mb-3">
            <CustomSelect value={jobForm.locationId} onChange={(v) => setJobForm({ ...jobForm, locationId: v, technicianId: "" })} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
          </div>
          <FieldLabel>Assign to</FieldLabel>
          <div className="mb-3">
            <CustomSelect required value={jobForm.technicianId} onChange={(v) => setJobForm({ ...jobForm, technicianId: v })} options={staffForBranch(jobForm.locationId).map((s) => ({ value: s.id, label: s.name + " · " + s.role }))} />
          </div>
          <FieldLabel>Due time (optional)</FieldLabel>
          <input value={jobForm.dueTime} onChange={(e) => setJobForm({ ...jobForm, dueTime: e.target.value })} placeholder="e.g. 2:00 PM" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Notes</FieldLabel>
          <input value={jobForm.notes} onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setJobOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Assign job</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
