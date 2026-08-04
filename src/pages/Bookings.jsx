import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useBranch, useUser } from "../App.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import CustomDatePicker from "../components/CustomDatePicker.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", successBg: "#E6F4EA" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();
const STATUS_COLORS = { Requested: { bg: "#F1F2F4", fg: "#667085" }, Confirmed: { bg: "#EEF2FF", fg: "#1745B3" }, "Checked-in": { bg: "#FEF3C7", fg: "#92400E" }, "In Progress": { bg: "#FEF3C7", fg: "#B45309" }, Completed: { bg: "#E6F4EA", fg: "#166534" }, Paid: { bg: "#E6F4EA", fg: "#166534" }, Closed: { bg: "#F1F2F4", fg: "#667085" }, "No Show": { bg: "#FDE8E7", fg: "#DC2626" } };

export default function Bookings() {
  const { loc, locations } = useBranch();
  const { user } = useUser();
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const blankForm = { locationId: locations[0]?.id || "", customerId: "", vehiclePlate: "", serviceIds: [], technicianId: "", scheduledTime: "09:00" };
  const [form, setForm] = useState(blankForm);

  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = () => Promise.all([api.getBookingsPaged(loc, dateFrom, dateTo, 0), api.getCustomers(), api.getServices(), api.getStaff()])
    .then(([b, c, s, st]) => { setBookings(b.rows); setTotal(b.total); setCustomers(c); setServices(s); setStaff(st); })
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
    const note = decision === "Approved" ? "" : prompt(`Note for the GM (why it needs ${decision === "Rejected" ? "rejecting" : "improvement"})?`) || "";
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

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Bookings</h1>
        <button onClick={openAdd} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ New Booking</button>
      </div>
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
        <span style={{ color: C.textSoft }} className="text-xs ml-auto">Showing {bookings.length} of {total}{!dateFrom && !dateTo ? " (most recent)" : ""}</span>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {bookings.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No bookings found for this view.</div>}
        {bookings.map((b, i) => {
          const sc = STATUS_COLORS[b.status] || STATUS_COLORS.Requested;
          const isFinished = ["Closed", "Paid", "No Show"].includes(b.status);
          return (
            <div key={b.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
              <div>
                <div style={{ color: C.ink }} className="text-sm font-semibold">{custName(b.customer_id)} — {b.vehicle_plate || "no plate"}</div>
                <div style={{ color: C.textSoft }} className="text-xs">{serviceNames(b.service_ids)} · {techName(b.technician_id)} · {b.scheduled_time || "unscheduled"}</div>
                {b.owner_review_status && (
                  <div style={{ color: b.owner_review_status === "Approved" ? "#166534" : b.owner_review_status === "Rejected" ? "#DC2626" : "#92400E" }} className="text-xs mt-0.5">
                    Owner review: {b.owner_review_status}{b.review_note ? ` — "${b.review_note}"` : ""}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ background: sc.bg, color: sc.fg }} className="text-xs font-medium px-2.5 py-1 rounded-full">{b.status}</span>
                {!isFinished && <button onClick={() => openEdit(b)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>}
                {!isFinished && <button onClick={() => advance(b.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>Advance →</button>}
                {!isFinished && <button onClick={() => noShow(b.id)} className="text-xs font-semibold" style={{ color: C.danger }}>No Show</button>}
                {b.status === "Completed" && !b.owner_review_status && <button onClick={() => sendForReview(b.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>Send for Owner Review</button>}
                {user?.isPrimaryOwner && b.owner_review_status === "Needs Review" && (
                  <>
                    <button onClick={() => ownerReview(b.id, "Approved")} className="text-xs font-semibold" style={{ color: "#166534" }}>Approve</button>
                    <button onClick={() => ownerReview(b.id, "Needs Improvement")} className="text-xs font-semibold" style={{ color: "#92400E" }}>Request Changes</button>
                    <button onClick={() => ownerReview(b.id, "Rejected")} className="text-xs font-semibold" style={{ color: C.danger }}>Reject</button>
                  </>
                )}
                {isFinished && <button onClick={() => removeFromList(b.id)} className="text-xs font-semibold" style={{ color: C.textSoft }}>Remove from list</button>}
              </div>
            </div>
          );
        })}
      </div>
      {bookings.length < total && (
        <div className="text-center mt-3">
          <button onClick={loadMore} disabled={loadingMore} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
            {loadingMore ? "Loading…" : "Load More"}
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6 max-h-[85vh] overflow-y-auto">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">{editing ? "Edit Booking" : "New Booking"}</div>

            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Branch</label>
            <div className="mb-3">
              <CustomSelect required value={form.locationId} onChange={(v) => setForm({ ...form, locationId: v })} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
            </div>

            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Customer</label>
            <div className="mb-3">
              <CustomSelect required value={form.customerId} onChange={(v) => setForm({ ...form, customerId: v })} options={customers.map((c) => ({ value: c.id, label: c.name }))} />
            </div>

            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Vehicle plate</label>
            <input value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} placeholder="T 123 ABC" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />

            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Services</label>
            <div style={{ borderColor: C.border }} className="border rounded-lg p-2 mb-3 max-h-32 overflow-y-auto flex flex-col gap-1">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                  {s.name} — {money(s.price)}
                </label>
              ))}
            </div>
            {!form.serviceIds.length && <div style={{ color: "#DC2626" }} className="text-xs mb-2 -mt-2">Select at least one service.</div>}

            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Technician</label>
            <div className="mb-3">
              <CustomSelect value={form.technicianId} onChange={(v) => setForm({ ...form, technicianId: v })} placeholder="Unassigned" options={staff.filter((s) => s.location_id === form.locationId).map((s) => ({ value: s.id, label: s.name }))} />
            </div>

            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Time</label>
            <input type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />

            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">{editing ? "Save Changes" : "Create Booking"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
