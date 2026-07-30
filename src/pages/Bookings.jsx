import React, { useState, useEffect } from "react";
import { api } from "../api.js";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", successBg: "#E6F4EA" };

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([api.getBookings(), api.getCustomers()])
    .then(([b, c]) => { setBookings(b); setCustomers(c); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const custName = (id) => customers.find((c) => c.id === id)?.name || "—";
  const advance = async (id) => { await api.advanceBooking(id); load(); };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <h1 style={{ color: C.ink }} className="text-xl font-bold mb-6">Bookings</h1>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {bookings.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No bookings yet — create one from the Customers page workflow once you wire it up, or via the API directly.</div>}
        {bookings.map((b, i) => (
          <div key={b.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{custName(b.customer_id)} — {b.vehicle_plate || "no plate"}</div>
              <div style={{ color: C.textSoft }} className="text-xs">{b.scheduled_time || "unscheduled"}</div>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ background: C.successBg, color: "#166534" }} className="text-xs font-medium px-2.5 py-1 rounded-full">{b.status}</span>
              {b.status !== "Closed" && <button onClick={() => advance(b.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>Advance →</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
