import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useBranch } from "../App.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import CustomDatePicker from "../components/CustomDatePicker.jsx";
import BarcodeScannerModal from "../components/BarcodeScannerModal.jsx";
import { X, Camera } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626", dangerBg: "#FEE2E2", amberBg: "#FEF3C7", amberDeep: "#92400E" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();
const PAYMENT_METHODS = ["Cash", "Control Number", "Mobile Money", "Bank Transfer"];

export default function Invoicing() {
  const { loc, locations } = useBranch();
  const [invoices, setInvoices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getSettings().then(setBusiness); }, []);
  const [creating, setCreating] = useState(null);
  const [discountPct, setDiscountPct] = useState(0);
  const [paying, setPaying] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMsg, setScanMsg] = useState("");

  const scanReceipt = async (code) => {
    setScannerOpen(false);
    setScanMsg("");
    try {
      const inv = await api.getInvoiceByControlNumber(code);
      setReceipt(inv);
    } catch {
      setScanMsg(`No invoice matches control number "${code}".`);
      setTimeout(() => setScanMsg(""), 4000);
    }
  };

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
              <button onClick={() => removePayment(p.id)} className="text-xs" style={{ color: C.textSoft }}><X size={14} /></button>
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
          <button onClick={() => setScannerOpen(true)} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Camera size={13} /> Scan Receipt</button>
          <div style={{ width: 140 }}>
            <CustomDatePicker value={dateFrom} onChange={setDateFrom} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between gap-2" style={{ borderColor: C.border }} />
          </div>
          <span style={{ color: C.textSoft }} className="text-xs">to</span>
          <div style={{ width: 140 }}>
            <CustomDatePicker value={dateTo} onChange={setDateTo} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between gap-2" style={{ borderColor: C.border }} />
          </div>
          {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs font-semibold" style={{ color: C.cyan }}>Clear</button>}
        </div>
      </div>
      {scanMsg && <div style={{ background: C.dangerBg, color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-2">{scanMsg}</div>}
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
          <div style={{ background: "#fff" }} className="wosha-printable w-full max-w-md rounded-xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6 pb-6" style={{ borderBottom: `2px solid ${C.ink}` }}>
              <div>
                {business?.logo_url && <img src={business.logo_url} alt="" style={{ height: 44 }} className="mb-2 object-contain" />}
                <div style={{ color: C.ink }} className="text-lg font-bold">{business?.business_name || "Wosha"}</div>
                {business?.address && <div style={{ color: C.textSoft }} className="text-xs">{business.address}</div>}
                {business?.phone && <div style={{ color: C.textSoft }} className="text-xs">{business.phone}</div>}
                {business?.tin && <div style={{ color: C.textSoft }} className="text-xs">TIN: {business.tin}</div>}
              </div>
              <div className="text-right">
                <div style={{ color: C.ink }} className="text-xl font-bold tracking-wide">INVOICE</div>
                <div style={{ color: C.textSoft }} className="text-xs mt-1">Control #{receipt.control_number}</div>
                <div style={{ color: C.textSoft }} className="text-xs">{new Date(receipt.created_at).toLocaleDateString()}</div>
                <span style={{ background: receipt.status === "Paid" ? "#E6F4EA" : C.dangerBg, color: receipt.status === "Paid" ? "#166534" : C.danger }} className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-2">{receipt.status}</span>
              </div>
            </div>

            {(receipt.bill_to || custName(bookings.find((b) => b.id === receipt.booking_id)?.customer_id) !== "—") && (
              <div className="mb-5">
                <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-1">Bill To</div>
                <div style={{ color: C.ink }} className="text-sm font-medium">{receipt.bill_to || custName(bookings.find((b) => b.id === receipt.booking_id)?.customer_id)}</div>
                {receipt.company_tin && <div style={{ color: C.textSoft }} className="text-xs">TIN: {receipt.company_tin}</div>}
                {receipt.company_address && <div style={{ color: C.textSoft }} className="text-xs">{receipt.company_address}</div>}
              </div>
            )}

            <table className="w-full text-sm mb-4" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th className="text-left py-2" style={{ color: C.textSoft, fontSize: 11 }}>DESCRIPTION</th>
                  <th className="text-center py-2" style={{ color: C.textSoft, fontSize: 11 }}>QTY</th>
                  <th className="text-right py-2" style={{ color: C.textSoft, fontSize: 11 }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {(receipt.items || []).map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid #F1F2F4` }}>
                    <td className="py-2" style={{ color: C.ink }}>{it.name}</td>
                    <td className="py-2 text-center" style={{ color: C.textSoft }}>{it.qty}</td>
                    <td className="py-2 text-right" style={{ color: C.ink, fontFamily: "monospace" }}>{money(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div style={{ width: 220 }}>
                <div className="flex justify-between text-sm py-1"><span style={{ color: C.textSoft }}>Subtotal</span><span style={{ color: C.ink, fontFamily: "monospace" }}>{money(receipt.subtotal)}</span></div>
                <div className="flex justify-between text-sm py-1"><span style={{ color: C.textSoft }}>Discount</span><span style={{ color: C.ink, fontFamily: "monospace" }}>-{money(receipt.discount)}</span></div>
                <div className="flex justify-between text-sm py-1"><span style={{ color: C.textSoft }}>Tax</span><span style={{ color: C.ink, fontFamily: "monospace" }}>{money(receipt.tax)}</span></div>
                <div className="flex justify-between text-base font-bold py-2 mt-1" style={{ borderTop: `2px solid ${C.ink}` }}><span style={{ color: C.ink }}>Total</span><span style={{ color: C.ink, fontFamily: "monospace" }}>{money(receipt.total)}</span></div>
              </div>
            </div>

            {receipt.payment_method && (
              <div style={{ color: C.textSoft }} className="text-xs mt-4">Paid via {receipt.payment_method}</div>
            )}
            <div className="flex flex-col items-center mt-5">
              <QRCodeSVG value={receipt.control_number} size={80} level="M" />
              <div style={{ color: C.textSoft }} className="text-[10px] mt-1">Scan to look this receipt back up</div>
            </div>
            <div style={{ color: C.textSoft, borderTop: `1px solid ${C.border}` }} className="text-xs text-center mt-3 pt-4">Thank you for your business.</div>

            <div className="wosha-no-print flex gap-2 mt-6">
              <button onClick={() => setReceipt(null)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Close</button>
              <button onClick={() => window.print()} style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Print</button>
            </div>
          </div>
        </div>
      )}

      {logPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submitLogPayment} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Log Expected Payment</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Method</label>
            <div className="mb-3">
              <CustomSelect value={paymentForm.method} onChange={(v) => setPaymentForm({ ...paymentForm, method: v })} options={["Bank Transfer", "Mobile Money", "Control Number"].map((m) => ({ value: m, label: m }))} />
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Reference / control number</label>
            <input value={paymentForm.referenceCode} onChange={(e) => setPaymentForm({ ...paymentForm, referenceCode: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Amount (TZS)</label>
            <input required type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Branch</label>
            <div className="mb-3">
              <CustomSelect required value={paymentForm.locationId} onChange={(v) => setPaymentForm({ ...paymentForm, locationId: v })} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Customer (optional)</label>
            <div className="mb-4">
              <CustomSelect value={paymentForm.customerId} onChange={(v) => setPaymentForm({ ...paymentForm, customerId: v })} placeholder="None" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setLogPaymentOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Log Payment</button>
            </div>
          </form>
        </div>
      )}

      {scannerOpen && <BarcodeScannerModal onDetected={scanReceipt} onClose={() => setScannerOpen(false)} />}
    </div>
  );
}
