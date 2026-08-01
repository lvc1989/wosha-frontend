import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useUser } from "../App.jsx";
import FileDropzone from "../components/FileDropzone.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626", successBg: "#E6F4EA" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();
const blank = { name: "", contact: "", email: "", category: "", capacity: "", criteria: "", leadTime: "", shortlisted: false };

export default function Suppliers() {
  const { user } = useUser();
  const canEdit = user?.role === "owner" || user?.role === "manager";
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payForm, setPayForm] = useState({ amount: "", method: "Bank Transfer", receiptUrl: "", receiptName: "" });
  const [payments, setPayments] = useState({}); // supplierId -> payments[]

  const openPay = async (s) => {
    setPayTarget(s);
    setPayForm({ amount: "", method: "Bank Transfer", receiptUrl: "", receiptName: "" });
    const list = await api.getSupplierPayments(s.id);
    setPayments((prev) => ({ ...prev, [s.id]: list }));
  };
  const submitPay = async (e) => {
    e.preventDefault();
    if (!payForm.amount) return;
    await api.addSupplierPayment({ supplierId: payTarget.id, ...payForm, amount: Number(payForm.amount) });
    const list = await api.getSupplierPayments(payTarget.id);
    setPayments((prev) => ({ ...prev, [payTarget.id]: list }));
    setPayForm({ amount: "", method: "Bank Transfer", receiptUrl: "", receiptName: "" });
  };
  const markReceiptDownloaded = async (paymentId, note) => {
    await api.markSupplierPaymentDownloaded(paymentId, note);
    const list = await api.getSupplierPayments(payTarget.id);
    setPayments((prev) => ({ ...prev, [payTarget.id]: list }));
  };

  const load = () => Promise.all([api.getSuppliers(), api.getCategories("supplier")]).then(([s, c]) => { setSuppliers(s); setCategories(c); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (s) => {
    setEditing(s.id);
    setForm({ name: s.name, contact: s.contact || "", email: s.email || "", category: s.category || "", capacity: s.capacity || "", criteria: s.criteria || "", leadTime: s.lead_time || "", shortlisted: s.shortlisted });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (editing) await api.updateSupplier(editing, form);
    else await api.addSupplier(form);
    setOpen(false);
    load();
  };
  const remove = async (id) => { if (confirm("Remove this supplier?")) { await api.removeSupplier(id); load(); } };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Suppliers</h1>
        {canEdit && <button onClick={openAdd} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Supplier</button>}
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {suppliers.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No suppliers yet — add one so purchase orders can request quotations.</div>}
        {suppliers.map((s, i) => (
          <div key={s.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{s.name} {s.shortlisted && <span style={{ background: C.successBg, color: "#166534" }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1">Shortlisted</span>}</div>
              <div style={{ color: C.textSoft }} className="text-xs">{s.category} · {s.email || "no email"} · {s.contact}</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => openPay(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>💳 Record Payment</button>
              {canEdit && <button onClick={() => openEdit(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>}
              {canEdit && <button onClick={() => remove(s.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6 max-h-[85vh] overflow-y-auto">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">{editing ? "Edit Supplier" : "Add Supplier"}</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              <option value="">Choose… (manage categories in Settings)</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Email (for quotation requests)</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Contact phone</label>
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Capacity</label>
            <input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. Bulk — 500L+/month" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Selection criteria / notes</label>
            <input value={form.criteria} onChange={(e) => setForm({ ...form, criteria: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Lead time</label>
            <input value={form.leadTime} onChange={(e) => setForm({ ...form, leadTime: e.target.value })} placeholder="e.g. 3 days" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="flex items-center gap-2 text-sm mb-4" style={{ color: C.ink }}>
              <input type="checkbox" checked={form.shortlisted} onChange={(e) => setForm({ ...form, shortlisted: e.target.checked })} />
              Shortlisted (eligible to be selected on purchase orders)
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Save</button>
            </div>
          </form>
        </div>
      )}

      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6 max-h-[85vh] overflow-y-auto">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Payments — {payTarget.name}</div>

            <div className="flex flex-col gap-2 mb-4">
              {(payments[payTarget.id] || []).map((p) => (
                <div key={p.id} style={{ background: "#F5F7FA" }} className="rounded-lg p-3">
                  <div style={{ color: C.ink }} className="text-sm font-semibold">{money(p.amount)} — {p.method}</div>
                  <div style={{ color: C.textSoft }} className="text-xs mb-1">{new Date(p.paid_at).toLocaleDateString()}</div>
                  {p.downloaded ? (
                    <div style={{ color: "#166534" }} className="text-xs">✓ Receipt downloaded{p.saved_location_note ? ` — saved to: ${p.saved_location_note}` : ""}</div>
                  ) : p.receipt_url ? (
                    <ReceiptDownload url={p.receipt_url} onConfirm={(note) => markReceiptDownloaded(p.id, note)} />
                  ) : (
                    <div style={{ color: C.textSoft }} className="text-xs">No receipt attached</div>
                  )}
                </div>
              ))}
              {(payments[payTarget.id] || []).length === 0 && <div style={{ color: C.textSoft }} className="text-xs">No payments recorded yet.</div>}
            </div>

            <form onSubmit={submitPay} style={{ borderTop: `1px solid ${C.border}` }} className="pt-4">
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Amount (TZS)</label>
              <input required type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Method</label>
              <select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
                <option>Bank Transfer</option>
                <option>Mobile Money</option>
                <option>Cash</option>
                <option>Control Number</option>
              </select>
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Receipt (optional)</label>
              <div className="mb-3">
                <FileDropzone accept="image/*,application/pdf" label="Drop the payment receipt here" onUploaded={(f) => setPayForm({ ...payForm, receiptUrl: f.url, receiptName: f.name })} />
                {payForm.receiptUrl && <div style={{ color: "#166534" }} className="text-xs mt-1">Attached: {payForm.receiptName}</div>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPayTarget(null)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Close</button>
                <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiptDownload({ url, onConfirm }) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const start = () => {
    const a = document.createElement("a");
    a.href = url; a.target = "_blank";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setAsking(true);
  };
  if (!asking) return <button onClick={start} className="text-xs font-semibold underline" style={{ color: C.cyan }}>Download Receipt</button>;
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-lg p-2 mt-1">
      <div style={{ color: C.ink }} className="text-xs font-medium mb-1">Where did you save it?</div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Accounts folder, Desktop" style={{ borderColor: C.border }} className="w-full border rounded px-2 py-1 text-xs mb-1" />
      <div className="flex gap-2">
        <button onClick={() => onConfirm(note || "Not specified")} style={{ background: C.cyan }} className="text-white text-xs font-semibold px-2 py-1 rounded">Confirm</button>
        <button onClick={() => onConfirm("Not specified")} style={{ color: C.textSoft }} className="text-xs">Skip</button>
      </div>
    </div>
  );
}
