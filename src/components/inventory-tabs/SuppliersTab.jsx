import React, { useState, useEffect } from "react";
import { api } from "../../api.js";
import { useUser, C } from "../../App.jsx";
import FileDropzone from "../FileDropzone.jsx";
import CustomSelect from "../CustomSelect.jsx";
import { CreditCard, Check, Truck, Plus } from "lucide-react";
import { ListRow, StatusPill, Button, Modal, FieldLabel, EmptyState, LoadingState } from "../ui.jsx";

const money = (n) => "TZS " + Number(n || 0).toLocaleString();
const blank = { name: "", contact: "", email: "", category: "", capacity: "", criteria: "", leadTime: "", shortlisted: false };

function ReceiptDownload({ url, onConfirm }) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const start = () => {
    const a = document.createElement("a");
    a.href = url; a.target = "_blank";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setAsking(true);
  };
  if (!asking) return <button onClick={start} className="text-xs font-semibold underline" style={{ color: C.cyan }}>Download receipt</button>;
  return (
    <div style={{ background: "#fff", border: "1px solid " + C.border }} className="rounded-lg p-2 mt-1">
      <div style={{ color: C.ink }} className="text-xs font-medium mb-1">Where did you save it?</div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Accounts folder, Desktop" style={{ borderColor: C.border }} className="w-full border rounded px-2 py-1 text-xs mb-1" />
      <div className="flex gap-2">
        <button onClick={() => onConfirm(note || "Not specified")} style={{ background: C.cyan }} className="text-white text-xs font-semibold px-2 py-1 rounded">Confirm</button>
        <button onClick={() => onConfirm("Not specified")} style={{ color: C.textSoft }} className="text-xs">Skip</button>
      </div>
    </div>
  );
}

// Original Suppliers.jsx, exactly — only the outer PageHeader was removed.
export default function SuppliersTab() {
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
  const [payments, setPayments] = useState({});

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

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div style={{ color: C.textSoft }} className="text-xs">{suppliers.length} on file</div>
        {canEdit && <Button onClick={openAdd}><span className="flex items-center gap-1.5"><Plus size={16} />Add supplier</span></Button>}
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-white rounded-xl"><EmptyState icon={Truck} title="No suppliers yet" body="Add one so purchase orders can request quotations." /></div>
      ) : (
        <div className="flex flex-col gap-2">
          {suppliers.map((s) => (
            <ListRow
              key={s.id}
              icon={Truck}
              tone={s.shortlisted ? "success" : "cyan"}
              title={s.name}
              subtitle={s.category + " · " + (s.email || "no email") + " · " + s.contact}
              trailing={
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {s.shortlisted && <StatusPill label="Shortlisted" tone="success" />}
                  <button onClick={() => openPay(s)} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.cyan }}><CreditCard size={13} /> Record payment</button>
                  {canEdit && <button onClick={() => openEdit(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>}
                  {canEdit && <button onClick={() => remove(s.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>}
                </div>
              }
            />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">{editing ? "Edit supplier" : "Add supplier"}</div>
          <FieldLabel>Name</FieldLabel>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Category</FieldLabel>
          <div className="mb-3">
            <CustomSelect value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="Choose… (manage categories in Settings)" options={categories.map((c) => ({ value: c.name, label: c.name }))} />
          </div>
          <FieldLabel>Email (for quotation requests)</FieldLabel>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Contact phone</FieldLabel>
          <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Capacity</FieldLabel>
          <input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. Bulk — 500L+/month" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Selection criteria / notes</FieldLabel>
          <input value={form.criteria} onChange={(e) => setForm({ ...form, criteria: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Lead time</FieldLabel>
          <input value={form.leadTime} onChange={(e) => setForm({ ...form, leadTime: e.target.value })} placeholder="e.g. 3 days" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <label className="flex items-center gap-2 text-sm mb-4" style={{ color: C.ink }}>
            <input type="checkbox" checked={form.shortlisted} onChange={(e) => setForm({ ...form, shortlisted: e.target.checked })} />
            Shortlisted (eligible to be selected on purchase orders)
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!payTarget} onClose={() => setPayTarget(null)}>
        {payTarget && (
          <>
            <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Payments — {payTarget.name}</div>

            <div className="flex flex-col gap-2 mb-4">
              {(payments[payTarget.id] || []).map((p) => (
                <div key={p.id} style={{ background: "#F5F7FA" }} className="rounded-lg p-3">
                  <div style={{ color: C.ink }} className="text-sm font-semibold">{money(p.amount)} — {p.method}</div>
                  <div style={{ color: C.textSoft }} className="text-xs mb-1">{new Date(p.paid_at).toLocaleDateString()}</div>
                  {p.downloaded ? (
                    <div style={{ color: "#185FA5" }} className="text-xs flex items-center gap-1"><Check size={12} /> Receipt downloaded{p.saved_location_note ? " — saved to: " + p.saved_location_note : ""}</div>
                  ) : p.receipt_url ? (
                    <ReceiptDownload url={p.receipt_url} onConfirm={(note) => markReceiptDownloaded(p.id, note)} />
                  ) : (
                    <div style={{ color: C.textSoft }} className="text-xs">No receipt attached</div>
                  )}
                </div>
              ))}
              {(payments[payTarget.id] || []).length === 0 && <div style={{ color: C.textSoft }} className="text-xs">No payments recorded yet.</div>}
            </div>

            <form onSubmit={submitPay} style={{ borderTop: "1px solid " + C.border }} className="pt-4">
              <FieldLabel>Amount (TZS)</FieldLabel>
              <input required type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
              <FieldLabel>Method</FieldLabel>
              <div className="mb-3">
                <CustomSelect value={payForm.method} onChange={(v) => setPayForm({ ...payForm, method: v })} options={["Bank Transfer", "Mobile Money", "Cash", "Control Number"].map((m) => ({ value: m, label: m }))} />
              </div>
              <FieldLabel>Receipt (optional)</FieldLabel>
              <div className="mb-3">
                <FileDropzone accept="image/*,application/pdf" label="Drop the payment receipt here" onUploaded={(f) => setPayForm({ ...payForm, receiptUrl: f.url, receiptName: f.name })} />
                {payForm.receiptUrl && <div style={{ color: "#185FA5" }} className="text-xs mt-1">Attached: {payForm.receiptName}</div>}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setPayTarget(null)} className="flex-1">Close</Button>
                <Button type="submit" className="flex-1">Record payment</Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}
