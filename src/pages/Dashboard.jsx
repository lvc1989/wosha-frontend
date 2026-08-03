import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useBranch } from "../App.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", amber: "#FFC93C", violet: "#1F2937", danger: "#DC2626", border: "#E4E7EC", textSoft: "#667085", amberBg: "#FEF3C7", amberDeep: "#92400E", dangerBg: "#FDE8E7" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();
const STATUS_COLORS = { Requested: { bg: "#F1F2F4", fg: "#667085" }, Confirmed: { bg: "#EEF2FF", fg: "#1745B3" }, "Checked-in": { bg: "#FEF3C7", fg: "#92400E" }, "In Progress": { bg: "#FEF3C7", fg: "#B45309" }, Completed: { bg: "#E6F4EA", fg: "#166534" }, Paid: { bg: "#E6F4EA", fg: "#166534" }, Closed: { bg: "#F1F2F4", fg: "#667085" } };

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderTop: `3px solid ${accent}` }} className="rounded-xl p-5">
      <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase tracking-wide mb-2">{label}</div>
      <div style={{ color: C.ink }} className="text-2xl font-bold mb-1">{value}</div>
      <div style={{ color: C.textSoft }} className="text-xs">{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const { loc, locations } = useBranch();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getBookings(loc), api.getInvoices(loc), api.getExpenses(), api.getCustomers(), api.getStaff(), api.getServices(), api.getReminders()])
      .then(([b, i, e, c, s, sv, r]) => { setBookings(b); setInvoices(i); setExpenses(e); setCustomers(c); setStaff(s); setServices(sv); setReminders(r); })
      .finally(() => setLoading(false));
  }, [loc]);

  const custName = (id) => customers.find((c) => c.id === id)?.name || "—";
  const techName = (id) => staff.find((s) => s.id === id)?.name || "Unassigned";
  const serviceNames = (ids) => (ids || []).map((id) => services.find((s) => s.id === id)?.name).filter(Boolean).join(", ") || "—";
  const locName = (id) => locations.find((l) => l.id === id)?.name || "";

  const goToReminder = (r) => {
    if (r.kind === "Task" || r.kind === "Compliance") navigate("/compliance");
    else if (r.kind === "Stock") navigate("/inventory");
    else if (r.kind === "Expense") navigate("/expenses");
    else if (r.kind === "Purchase Order") navigate("/purchase-orders");
  };

  if (loading) return <div style={{ color: C.textSoft }}>Loading dashboard…</div>;

  const revenue = invoices.reduce((s, i) => s + Number(i.paid || 0), 0);
  const expTotal = expenses.filter((e) => e.status === "Approved").reduce((s, e) => s + Number(e.amount || 0), 0);
  const activeJobs = bookings.filter((b) => ["In Progress", "Checked-in"].includes(b.status)).length;

  return (
    <div>
      <h1 style={{ color: C.ink }} className="text-xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Bookings" value={bookings.length} sub={loc === "all" ? "All branches" : locName(loc)} accent={C.cyan} />
        <StatCard label="Revenue Collected" value={money(revenue)} sub="From paid invoices" accent={C.amber} />
        <StatCard label="Active Jobs" value={activeJobs} sub="In progress / checked-in" accent={C.violet} />
        <StatCard label="Expenses Logged" value={money(expTotal)} sub="Approved this period" accent={C.danger} />
      </div>

      {reminders.length > 0 && (
        <div className="mb-6">
          <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Reminders</div>
          <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
            {reminders.slice(0, 5).map((r, i) => (
              <button key={r.id} onClick={() => goToReminder(r)} className="w-full flex items-center justify-between gap-2 flex-wrap px-5 py-3 text-left hover:bg-black/5" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
                <span style={{ color: C.ink }} className="text-sm">{r.label}</span>
                <span style={{ background: r.urgent ? C.dangerBg : C.amberBg, color: r.urgent ? C.danger : C.amberDeep }} className="text-xs font-medium px-2.5 py-1 rounded-full">{r.kind}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Today's schedule</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {bookings.length === 0 && <div className="p-6 text-sm" style={{ color: C.textSoft }}>No bookings for this view.</div>}
        {bookings.map((b, i) => {
          const sc = STATUS_COLORS[b.status] || STATUS_COLORS.Requested;
          return (
            <div key={b.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
              <div>
                <div style={{ color: C.ink }} className="text-sm font-semibold">{custName(b.customer_id)} — {b.vehicle_plate || "no plate"}</div>
                <div style={{ color: C.textSoft }} className="text-xs">{serviceNames(b.service_ids)} · {techName(b.technician_id)} · {b.scheduled_time || "unscheduled"}</div>
              </div>
              <span style={{ background: sc.bg, color: sc.fg }} className="text-xs font-medium px-2.5 py-1 rounded-full">{b.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
