import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useBranch } from "../App.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626", dangerBg: "#FEE2E2", amberBg: "#FEF3C7", amberDeep: "#92400E" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();
const PAYMENT_METHODS = ["Cash", "Control Number", "Mobile Money", "Bank Transfer"];

export default function Invoicing() {
  const { loc, locations } = useBranch();
  const [invoices, setInvoices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);
  const [discountPct, setDiscountPct] = useState(0);
  const [paying, setPaying] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pendingPayments, setPendingPayments] = useState([]);
  const [logPaymentOpen, setLogPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ method: "Bank Transfer", referenceCode: "", amount: "", customerId: "", notes: "", locationId: "" });

  const load = () => Promise.all([api.getInvoicesPaged(loc, dateFrom, dateTo, 0), api.getBookings(loc), api.getCustomers(), api.getServices(), api.getIncomingPayments("Pending")])
    .then(([i, b, c, s, pp]) => { setInvoices(i.rows); setTotal(i.total); setBookings(b); setCustomers(c); setServices(s); setPendingPayments(pp); })
    .finally(() => setLoading(false));
  useEffect(() => { setLoading(true); load(); }, [loc, dateFrom, dateTo]);

  const submitLogPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || !paymentForm.locationId) return;
    await api.logIncomingPayment({ ...paymentForm, amount: Number(paymentForm.amount) });
    setPaymentForm({ method: "Bank Transfer", referenceCode: "", amount: "", customerId: "", notes: "", locationId: loc !== "all" ? loc : (locations[0]?.id || "") });
    setLogPaymentOpen(false);
    load();
  };
  const confirmPayment = async (id) => { if (confirm("Confirm this payment was received? This adds it to income right away.")) { await api.confirmIncomingPayment(id); load(); } };
  const removePayment = async (id) => { await api.removeIncomingPayment(id); load(); };

  const loadMore = async () => {
    setLoadingMore(true);
    const { rows } = await api.getInvoicesPaged(loc, dateFrom, dateTo, invoices.length);
    setInvoices((prev) => [...prev, ...rows]);
    setLoadingMore(false);
  };

  const custName = (id) => customers.find((c) => c.id === id)?.name || "—";
  const serviceTotal = (ids) => (ids || []).reduce((sum, id) => sum + Number(services.find((s) => s.id === id)?.price || 0), 0);
  const serviceNames = (ids) => (ids || []).map((id) => services.find((s) => s.id === id)?.name).filter(Boolean).join(", ") || "—";

  const invoicedBookingIds = new Set(invoices.map((i) => i.booking_id));
  const readyToInvoice = bookings.filter((b) => b.status === "Completed" && !invoicedBookingIds.has(b.id));

  const openCreate = (b) => { setCreating(b); setDiscountPct(0); };
  const confirmCreate = async () => {
    const items = (creating.service_ids || []).map((id) => {
      const s = services.find((x) => x.id === id);
      return { name: s?.name || "Service", rate: Number(s?.price || 0), qty: 1 };
    });
    await api.createInvoice({ bookingId: creating.id, locationId: creating.location_id, items, discountPercent: Number(discountPct) || 0, taxPercent: 18 });
    setCreating(null);
    load();
  };

  const recordPayment = async (method) => { await api.payInvoice(paying, method); setPaying(null); load(); };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <h1 style={{ color: C.ink }} className="text-xl font-bold mb-6">Invoicing</h1>

      <div className="flex items-center justify-between mb-2">
        <div style={{ color: C.ink }} className="text-sm font-semibold">Incoming payments (bank transfer / mobile money / control number)</div>
        <button onClick={() => { setPaymentForm((f) => ({ ...f, locationId: loc !== "all" ? loc : (locations[0]?.id || "") })); setLogPaymentOpen(true); }} className="text-xs font-semibold" style={{ color: C.cyan }}>+ Log Expected Payment</button>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden mb-6">
        {pendingPayments.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No pending payments — logged payments will need confirming once they land, which adds them straight to income.</div>}
        {pendingPayments.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{money(p.amount)} — {p.method}</div>
              <div style={{ color: C.textSoft }} className="text-xs">{p.reference_code ? `Ref ${p.reference_code} · ` : ""}{p.customer_name || "No customer linked"}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => confirmPayment(p.id)} style={{ background: C.cyan }} className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg">Confirm Received</button>
              <button onClick={() => removePayment(p.id)} className="text-xs" style={{ color: C.textSoft }}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Ready to invoice</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden mb-6">
        {readyToInvoice.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No completed jobs waiting for an invoice.</div>}
        {readyToInvoice.map((b, i) => (
          <div key={b.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{custName(b.customer_id)} — {b.vehicle_plate || "no plate"}</div>
              <div style={{ color: C.textSoft }} className="text-xs">{serviceNames(b.service_ids)} · {money(serviceTotal(b.service_ids))}</div>
            </div>
            <button onClick={() => openCreate(b)} style={{ background: C.cyan }} className="text-white text-xs font-semibold px-3 py-2 rounded-lg">Create Invoice</button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div style={{ color: C.ink }} className="text-sm font-semibold">Invoices</div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ borderColor: C.border }} className="border rounded-lg px-2 py-1.5 text-xs" />
          <span style={{ color: C.textSoft }} className="text-xs">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ borderColor: C.border }} className="border rounded-lg px-2 py-1.5 text-xs" />
          {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs font-semibold" style={{ color: C.cyan }}>Clear</button>}
        </div>
      </div>
      <div style={{ color: C.textSoft }} className="text-xs mb-2">Showing {invoices.length} of {total}{!dateFrom && !dateTo ? " (most recent)" : ""}</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {invoices.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No invoices found for this view.</div>}
        {invoices.map((inv, i) => (
          <div key={inv.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink, fontFamily: "monospace" }} className="text-sm font-semibold">{money(inv.total)}</div>
              <div style={{ color: C.textSoft }} className="text-xs">Control #{inv.control_number} · {custName(bookings.find((b) => b.id === inv.booking_id)?.customer_id)}</div>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ background: inv.status === "Paid" ? "#E6F4EA" : C.dangerBg, color: inv.status === "Paid" ? "#166534" : C.danger }} className="text-xs font-medium px-2.5 py-1 rounded-full">{inv.status}</span>
              {inv.status !== "Paid" && <button onClick={() => setPaying(inv.id)} style={{ color: C.amberDeep }} className="text-xs font-semibold">Record Payment</button>}
              <button onClick={() => setReceipt(inv)} className="text-xs font-semibold" style={{ color: C.cyan }}>Receipt</button>
            </div>
          </div>
        ))}
      </div>
      {invoices.length < total && (
        <div className="text-center mt-3">
          <button onClick={loadMore} disabled={loadingMore} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
            {loadingMore ? "Loading…" : "Load More"}
          </button>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-2">Create Invoice</div>
            <div style={{ color: C.textSoft }} className="text-sm mb-4">{custName(creating.customer_id)} — {serviceNames(creating.service_ids)}</div>
            <div className="flex justify-between text-sm mb-3"><span style={{ color: C.textSoft }}>Subtotal</span><span style={{ color: C.ink, fontFamily: "monospace" }}>{money(serviceTotal(creating.service_ids))}</span></div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Discount (%)</label>
            <input type="number" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <div style={{ color: C.textSoft }} className="text-xs mb-4">Tax (18%) applied automatically.</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCreating(null)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button onClick={confirmCreate} style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}

      {paying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-1">Record Payment</div>
            <div style={{ color: C.textSoft }} className="text-sm mb-4">Choose how this was paid.</div>
            <div className="flex flex-col gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button key={m} onClick={() => recordPayment(m)} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-sm font-semibold py-2 rounded-lg">{m}</button>
              ))}
            </div>
            <button onClick={() => setPaying(null)} style={{ color: C.textSoft }} className="text-xs font-semibold mt-3">Cancel</button>
          </div>
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-1">Receipt</div>
            <div style={{ color: C.textSoft }} className="text-xs mb-4">Control #{receipt.control_number}</div>
            {(receipt.items || []).map((it, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span style={{ color: C.ink }}>{it.name} × {it.qty}</span>
                <span style={{ color: C.ink, fontFamily: "monospace" }}>{money(it.amount)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${C.border}` }} className="mt-2 pt-2 flex justify-between text-sm">
              <span style={{ color: C.textSoft }}>Discount</span><span style={{ color: C.ink, fontFamily: "monospace" }}>{money(receipt.discount)}</span>
            </div>
            <div className="flex justify-between text-sm"><span style={{ color: C.textSoft }}>Tax</span><span style={{ color: C.ink, fontFamily: "monospace" }}>{money(receipt.tax)}</span></div>
            <div className="flex justify-between text-base font-bold mt-1"><span style={{ color: C.ink }}>Total</span><span style={{ color: C.ink, fontFamily: "monospace" }}>{money(receipt.total)}</span></div>
            <button onClick={() => window.print()} style={{ background: C.cyan }} className="w-full text-white text-sm font-semibold py-2 rounded-lg mt-4">Print</button>
            <button onClick={() => setReceipt(null)} style={{ color: C.textSoft }} className="text-xs font-semibold mt-3 block mx-auto">Close</button>
          </div>
        </div>
      )}

      {logPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submitLogPayment} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Log Expected Payment</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Method</label>
            <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              <option>Bank Transfer</option>
              <option>Mobile Money</option>
              <option>Control Number</option>
            </select>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Reference / control number</label>
            <input value={paymentForm.referenceCode} onChange={(e) => setPaymentForm({ ...paymentForm, referenceCode: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Amount (TZS)</label>
            <input required type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Branch</label>
            <select required value={paymentForm.locationId} onChange={(e) => setPaymentForm({ ...paymentForm, locationId: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              <option value="">Choose…</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Customer (optional)</label>
            <select value={paymentForm.customerId} onChange={(e) => setPaymentForm({ ...paymentForm, customerId: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm">
              <option value="">None</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={() => setLogPaymentOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Log Payment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
