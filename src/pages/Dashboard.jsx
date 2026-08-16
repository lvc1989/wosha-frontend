import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Wallet, ClipboardCheck, AlertTriangle, Car, Bike, ScanLine, UserPlus, FileText, Package } from "lucide-react";
import { api } from "../api.js";
import { useBranch, useUser, C } from "../App.jsx";
import { PageHeader, StatCard, ListRow, StatusPill, EmptyState, QuickActionGrid } from "../components/ui.jsx";

const money = (n) => "TSh " + Number(n || 0).toLocaleString();

const STATUS_TONE = {
  Requested: "ink", Confirmed: "cyan", "Checked-in": "amber", "In Progress": "amber",
  Completed: "success", Paid: "success", Closed: "ink", "No Show": "danger",
};

export default function Dashboard() {
  const { loc, locations } = useBranch();
  const { user } = useUser();
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
    else if (r.kind === "Expense") navigate("/finance?tab=expenses");
    else if (r.kind === "Purchase Order") navigate("/inventory?tab=orders");
  };

  if (loading) return <div style={{ color: C.textSoft }} className="text-sm">Loading dashboard…</div>;

  const revenue = invoices.reduce((s, i) => s + Number(i.paid || 0), 0);
  const expTotal = expenses.filter((e) => e.status === "Approved").reduce((s, e) => s + Number(e.amount || 0), 0);
  const activeJobs = bookings.filter((b) => ["In Progress", "Checked-in"].includes(b.status)).length;
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = (user?.name || "").split(" ")[0];

  return (
    <div>
      <PageHeader
        title={greeting + (firstName ? ", " + firstName : "")}
        subtitle={(loc === "all" ? "All branches" : locName(loc)) + " · " + new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Bookings" value={bookings.length} icon={Calendar} tone="cyan" />
        <StatCard label="Revenue collected" value={money(revenue)} icon={Wallet} tone="ink" />
        <StatCard label="Active jobs" value={activeJobs} icon={ClipboardCheck} tone="success" />
        <StatCard label="Expenses approved" value={money(expTotal)} icon={AlertTriangle} tone="amber" />
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Quick actions</div>
      <div className="mb-6">
        <QuickActionGrid
          items={[
            { icon: Calendar, label: "New booking", tone: "cyan", onClick: () => navigate("/bookings") },
            { icon: ScanLine, label: "Record sale", tone: "cyan", onClick: () => navigate("/sales") },
            { icon: UserPlus, label: "Add customer", tone: "cyan", onClick: () => navigate("/customers") },
            { icon: FileText, label: "Invoicing", tone: "cyan", onClick: () => navigate("/finance") },
            { icon: Package, label: "Inventory", tone: "cyan", onClick: () => navigate("/inventory") },
            { icon: Wallet, label: "Log expense", tone: "cyan", onClick: () => navigate("/finance?tab=expenses") },
          ]}
        />
      </div>

      {reminders.length > 0 && (
        <div className="mb-6">
          <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Reminders</div>
          <div className="flex flex-col gap-2">
            {reminders.slice(0, 5).map((r) => (
              <ListRow
                key={r.id}
                onClick={() => goToReminder(r)}
                tone={r.urgent ? "danger" : "amber"}
                title={r.label}
                trailing={<StatusPill label={r.kind} tone={r.urgent ? "danger" : "amber"} />}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Today's schedule</div>
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl">
          <EmptyState icon={Calendar} title="No bookings for this view" body="Bookings for the selected branch will show up here as they come in." />
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
                subtitle={serviceNames(b.service_ids) + " · " + techName(b.technician_id) + " · " + (b.scheduled_time || "unscheduled")}
                trailing={
                  <div className="flex items-center gap-2">
                    <StatusPill label={b.status} tone={tone} />
                    {isFinished && (
                      <button
                        onClick={async (e) => { e.stopPropagation(); await api.archiveBooking(b.id); setBookings((prev) => prev.filter((x) => x.id !== b.id)); }}
                        style={{ color: C.textSoft }}
                        className="text-xs font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
