import React, { useState, useEffect } from "react";
import { api } from "../api.js";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085" };

function Stat({ label, value, sub }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-5">
      <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase tracking-wide mb-2">{label}</div>
      <div style={{ color: C.ink }} className="text-2xl font-bold mb-1">{value}</div>
      <div style={{ color: C.textSoft }} className="text-xs">{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getBookings(), api.getInvoices()])
      .then(([b, i]) => { setBookings(b); setInvoices(i); })
      .finally(() => setLoading(false));
  }, []);

  const revenue = invoices.reduce((s, i) => s + Number(i.paid || 0), 0);

  if (loading) return <div style={{ color: C.textSoft }}>Loading dashboard…</div>;

  return (
    <div>
      <h1 style={{ color: C.ink, fontFamily: "system-ui" }} className="text-xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Total Bookings" value={bookings.length} sub="All time, from the database" />
        <Stat label="Revenue Collected" value={"TZS " + revenue.toLocaleString()} sub="From paid invoices" />
        <Stat label="Open Invoices" value={invoices.filter((i) => i.status !== "Paid").length} sub="Awaiting payment" />
      </div>
      <div style={{ color: C.textSoft }} className="text-xs mt-6">
        This data is live from your PostgreSQL database via the API — not local browser storage. Refreshing the page, or opening this on a different device, shows the same real data.
      </div>
    </div>
  );
}
