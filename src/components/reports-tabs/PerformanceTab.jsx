import React, { useState, useEffect } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "../../api.js";
import { useBranch, C } from "../../App.jsx";
import CustomSelect from "../CustomSelect.jsx";
import CustomDatePicker from "../CustomDatePicker.jsx";
import { PrintHeader, PrintFooter } from "../PrintHeaderFooter.jsx";
import { Printer } from "lucide-react";
import { Button, LoadingState } from "../ui.jsx";

const money = (n) => "TZS " + Number(n || 0).toLocaleString();
const PIE_COLORS = [C.cyan, C.amber, "#0B1B33", "#2B6CF6", "#966B00"];
const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());

function periodRange(period, anchor) {
  const d = new Date(anchor);
  if (period === "day") return { from: toDateStr(d), to: toDateStr(d) };
  if (period === "month") {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { from: toDateStr(start), to: toDateStr(end) };
  }
  if (period === "year") {
    return { from: d.getFullYear() + "-01-01", to: d.getFullYear() + "-12-31" };
  }
  return { from: "", to: "" };
}

// Original Reports.jsx, exactly — only the outer PageHeader was removed (the
// Print button now sits just below, matching how every other merged tab moved
// its primary action out of the shared header). The printed-report structure
// below (.wosha-printable) is copied character for character.
export default function PerformanceTab() {
  const { locations } = useBranch();
  const [period, setPeriod] = useState("month");
  const [anchor, setAnchor] = useState(toDateStr(new Date()));
  const [reportBranch, setReportBranch] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  const { from, to } = periodRange(period, anchor);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getBookingsPaged(reportBranch, from, to, 0),
      api.getInvoicesPaged(reportBranch, from, to, 0),
      api.getExpenses({ locationId: reportBranch, from, to }),
      api.getServices(),
    ]).then(([b, i, e, sv]) => { setBookings(b.rows); setInvoices(i.rows); setExpenses(e); setServices(sv); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [period, anchor, reportBranch]);

  if (loading) return <LoadingState />;

  const branchesToShow = reportBranch === "all" ? locations : locations.filter((l) => l.id === reportBranch);
  const revenueByLocation = branchesToShow.map((l) => ({
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

  const grossProfit = revenueByLocation.reduce((s, l) => s + l.revenue, 0);
  const totalExpense = revenueByLocation.reduce((s, l) => s + l.expenses, 0);
  const netProfit = grossProfit - totalExpense;

  const periodLabel = period === "day" ? "on " + anchor : period === "month" ? "for " + anchor.slice(0, 7) : period === "year" ? "for " + anchor.slice(0, 4) : "— all time";

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setPrinting(true)} style={{ border: "1px solid " + C.border, color: C.ink }} className="text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"><Printer size={15} /> Print report</button>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        {["day", "month", "year", "all"].map((p) => (
          <button key={p} onClick={() => setPeriod(p)} style={{ background: period === p ? C.cyan : "#fff", color: period === p ? "#fff" : C.ink, border: "1px solid " + C.border }} className="text-xs font-semibold px-3 py-1.5 rounded-full capitalize">{p === "all" ? "All time" : p}</button>
        ))}
        {period === "day" && (
          <div style={{ width: 150 }}>
            <CustomDatePicker value={anchor} onChange={setAnchor} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between gap-2" style={{ borderColor: C.border }} />
          </div>
        )}
        {(period === "month" || period === "year") && (
          <input type={period === "month" ? "month" : "number"} value={period === "year" ? anchor.slice(0, 4) : anchor.slice(0, 7)}
            onChange={(e) => setAnchor(period === "year" ? e.target.value + "-01-01" : e.target.value + "-01")}
            style={{ borderColor: C.border }} className="border rounded-lg px-2 py-1.5 text-xs" />
        )}
        <div className="ml-auto" style={{ width: 160 }}>
          <CustomSelect value={reportBranch} onChange={setReportBranch} options={[{ value: "all", label: "All branches" }, ...locations.map((l) => ({ value: l.id, label: l.name }))]} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between" style={{ borderColor: C.border }} />
        </div>
      </div>
      <div style={{ color: C.textSoft }} className="text-xs mb-4">Showing {reportBranch === "all" ? "all branches" : locations.find((l) => l.id === reportBranch)?.name} {periodLabel}</div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Profit &amp; loss</div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div style={{ background: "#E6F1FB" }} className="relative overflow-hidden rounded-2xl p-4 text-center">
          <div style={{ background: `rgba(24,95,165,${C.heroBubbleOpacity})` }} className="wosha-hero-bubble-1 absolute -right-4 -top-6 w-20 h-20 rounded-full" />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#185FA5" }} className="relative text-lg sm:text-2xl font-semibold break-all sm:break-normal">{money(grossProfit)}</div>
          <div style={{ color: "#185FA5" }} className="relative text-xs font-medium mt-1">Gross Profit</div>
        </div>
        <div style={{ background: "#FDE8E7" }} className="relative overflow-hidden rounded-2xl p-4 text-center">
          <div style={{ background: `rgba(220,38,38,${C.heroBubbleOpacity})` }} className="wosha-hero-bubble-2 absolute -right-4 -top-6 w-20 h-20 rounded-full" />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.danger }} className="relative text-lg sm:text-2xl font-semibold break-all sm:break-normal">{money(totalExpense)}</div>
          <div style={{ color: C.danger }} className="relative text-xs font-medium mt-1">Expense</div>
        </div>
      </div>
      <div className="bg-white rounded-2xl overflow-hidden mb-6">
        {revenueByLocation.map((l, i) => (
          <div key={l.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 px-4 py-2.5 text-sm" style={{ borderTop: i === 0 ? "none" : "1px solid " + C.border }}>
            <span style={{ color: C.ink }} className="truncate">{l.name}</span>
            <span style={{ color: C.textSoft, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs sm:text-sm shrink-0">+{money(l.revenue)} / -{money(l.expenses)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid " + C.border, background: netProfit >= 0 ? "#E6F1FB" : "#FDE8E7" }}>
          <span style={{ color: C.ink }} className="text-sm font-bold">Net Profit (Income − Expense)</span>
          <span style={{ color: netProfit >= 0 ? "#185FA5" : C.danger, fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm font-bold">{money(netProfit)}</span>
        </div>
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Revenue vs. expenses by branch</div>
      <div className="bg-white rounded-2xl p-5 mb-6">
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
      <div className="bg-white rounded-2xl p-5">
        {categoryMix.length === 0 ? (
          <div style={{ color: C.textSoft }} className="text-sm text-center py-8">No bookings in this period.</div>
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
          <div style={{ background: "#fff" }} className="wosha-printable w-full max-w-sm rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <PrintHeader />
            <div style={{ color: C.ink }} className="text-lg font-bold mb-1">Wosha — Business Report</div>
            <div style={{ color: C.textSoft }} className="text-xs mb-4">{reportBranch === "all" ? "All branches" : locations.find((l) => l.id === reportBranch)?.name} {periodLabel}</div>
            <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: "1px solid " + C.border }}>
              <span style={{ color: C.ink }} className="text-sm font-bold">Net Profit</span>
              <span style={{ color: netProfit >= 0 ? "#185FA5" : C.danger, fontFamily: "'IBM Plex Mono', monospace" }} className="text-base font-bold">{money(netProfit)}</span>
            </div>
            <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Revenue vs. expenses by branch</div>
            <div className="flex flex-col gap-2 mb-5">
              {revenueByLocation.map((l) => (
                <div key={l.name} className="flex flex-col gap-0.5 text-sm">
                  <span style={{ color: C.ink }} className="truncate">{l.name}</span>
                  <span style={{ color: C.textSoft, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xs">+{money(l.revenue)} / -{money(l.expenses)}</span>
                </div>
              ))}
            </div>
            <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Booking mix by category</div>
            <div className="flex flex-col gap-2 mb-4">
              {categoryMix.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-2 text-sm">
                  <span style={{ color: C.ink }} className="truncate">{c.name}</span>
                  <span style={{ color: C.textSoft, fontFamily: "'IBM Plex Mono', monospace" }} className="shrink-0">{c.value} bookings</span>
                </div>
              ))}
            </div>
            <PrintFooter />
            <button onClick={() => window.print()} style={{ background: C.cyan }} className="w-full text-white text-sm font-semibold py-2 rounded-lg mb-2 wosha-no-print">Print</button>
            <button onClick={() => setPrinting(false)} style={{ color: C.textSoft }} className="text-xs font-semibold block mx-auto wosha-no-print">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
