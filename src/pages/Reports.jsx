import React, { useState, useEffect } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "../api.js";
import { useBranch } from "../App.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", amber: "#FFC93C", violet: "#1F2937", border: "#E4E7EC", textSoft: "#667085" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();
const PIE_COLORS = [C.cyan, C.amber, C.violet, "#166534", "#92400E"];

export default function Reports() {
  const { locations } = useBranch();
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    Promise.all([api.getBookings(), api.getInvoices(), api.getExpenses(), api.getServices()])
      .then(([b, i, e, sv]) => { setBookings(b); setInvoices(i); setExpenses(e); setServices(sv); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  const revenueByLocation = locations.map((l) => ({
    name: l.name,
    revenue: invoices.filter((i) => i.location_id === l.id).reduce((s, i) => s + Number(i.paid || 0), 0),
    expenses: expenses.filter((e) => e.location_id === l.id && e.status === "Approved").reduce((s, e) => s + Number(e.amount || 0), 0),
  }));

  const categoryCounts = {};
  bookings.forEach((b) => (b.service_ids || []).forEach((id) => {
    const svc = services.find((s) => s.id === id);
    if (svc) categoryCounts[svc.category] = (categoryCounts[svc.category] || 0) + 1;
  }));
  const categoryMix = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Reports</h1>
        <button onClick={() => setPrinting(true)} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-sm font-semibold px-4 py-2 rounded-lg">🖨 Print Report</button>
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Revenue vs. expenses by branch</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-5 mb-6">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={revenueByLocation}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => money(v)} />
            <Legend />
            <Bar dataKey="revenue" fill={C.cyan} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill={C.amber} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Booking mix by service category</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-5">
        {categoryMix.length === 0 ? (
          <div style={{ color: C.textSoft }} className="text-sm text-center py-8">No bookings yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {categoryMix.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {printing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Wosha — Business Report</div>
            <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Revenue vs. expenses by branch</div>
            <div className="flex flex-col gap-2 mb-5">
              {revenueByLocation.map((l) => (
                <div key={l.name} className="flex items-center justify-between text-sm">
                  <span style={{ color: C.ink }}>{l.name}</span>
                  <span style={{ color: C.textSoft, fontFamily: "monospace" }}>+{money(l.revenue)} / -{money(l.expenses)}</span>
                </div>
              ))}
            </div>
            <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Booking mix by category</div>
            <div className="flex flex-col gap-2 mb-4">
              {categoryMix.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span style={{ color: C.ink }}>{c.name}</span>
                  <span style={{ color: C.textSoft, fontFamily: "monospace" }}>{c.value} bookings</span>
                </div>
              ))}
            </div>
            <button onClick={() => window.print()} style={{ background: C.cyan }} className="w-full text-white text-sm font-semibold py-2 rounded-lg mb-2">Print</button>
            <button onClick={() => setPrinting(false)} style={{ color: C.textSoft }} className="text-xs font-semibold block mx-auto">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
