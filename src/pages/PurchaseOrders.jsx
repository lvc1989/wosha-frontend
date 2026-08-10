import React, { useState, useEffect, lazy, Suspense } from "react";
import { api } from "../api.js";
import FileDropzone from "../components/FileDropzone.jsx";
const BarcodeScannerModal = lazy(() => import("../components/BarcodeScannerModal.jsx"));
import CustomSelect from "../components/CustomSelect.jsx";
import { CheckCircle2, Circle, Camera, X } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", amberBg: "#FEF3C7", amberDeep: "#92400E", successBg: "#E6F4EA", danger: "#DC2626" };
const PAYMENT_TERMS = ["Full payment", "Half payment", "Quarter payment", "Advance", "Pay on delivery"];

function PODetail({ po, suppliers, load, quickAddSupplier }) {
  const [selectedSupplierIds, setSelectedSupplierIds] = useState([]);
  const [sendResult, setSendResult] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: "", email: "" });
  const [scanningItemId, setScanningItemId] = useState(null);

  const shortlisted = suppliers.filter((s) => s.shortlisted);
  const toggleSupplier = (id) => setSelectedSupplierIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const sendQuotation = async () => {
    if (!selectedSupplierIds.length) return;
    const result = await api.sendPOQuotation(po.id, selectedSupplierIds);
    setSendResult(result.results);
    load();
  };

  const quickAdd = async (e) => {
    e.preventDefault();
    const supplier = await quickAddSupplier(quickForm);
    setSelectedSupplierIds((prev) => [...prev, supplier.id]);
    setQuickForm({ name: "", email: "" });
    setQuickAddOpen(false);
  };

  const assignAwarded = async (supplierId) => { await api.assignPOSupplier(po.id, supplierId); load(); };
  const setPaymentTerms = async (terms) => { await api.setPOPaymentTerms(po.id, terms); load(); };
  const addNote = async (e) => { e.preventDefault(); if (!noteText.trim()) return; await api.addPONote(po.id, noteText); setNoteText(""); load(); };
  const attachFile = async (field, url) => { await api.setPOAttachment(po.id, field, url); load(); };

  const scanReceive = async (code) => {
    setScanningItemId(null);
    const item = po.items.find((it) => it.id === scanningItemId);
    if (!item) return;
    await api.receivePOItemScan(po.id, item.id, code, 1);
    load();
  };

  const allReceived = po.items.every((it) => Number(it.received_qty || 0) >= Number(it.qty));
  const finalize = async () => { await api.finalizePOReceived(po.id); load(); };

  return (
    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
      <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-2">Request Quotations</div>
      <div className="flex flex-col gap-1 mb-2">
        {shortlisted.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selectedSupplierIds.includes(s.id)} onChange={() => toggleSupplier(s.id)} />
            <span style={{ color: C.ink }}>{s.name}</span>
            <span style={{ color: C.textSoft }} className="text-xs">— {s.email || "no email on file"}</span>
          </label>
        ))}
      </div>
      {!quickAddOpen ? (
        <button type="button" onClick={() => setQuickAddOpen(true)} className="text-xs font-semibold mb-2" style={{ color: C.cyan }}>+ Add New Supplier</button>
      ) : (
        <form onSubmit={quickAdd} className="flex gap-2 mb-2">
          <input required placeholder="Supplier name" value={quickForm.name} onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-2 py-1.5 text-xs" />
          <input required type="email" placeholder="Email" value={quickForm.email} onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-2 py-1.5 text-xs" />
          <button type="submit" style={{ background: C.cyan }} className="text-white text-xs font-semibold px-3 rounded-lg">Add</button>
        </form>
      )}
      <button onClick={sendQuotation} disabled={!selectedSupplierIds.length} style={{ background: C.cyan }} className="text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40 mb-2">Send Quotation to Selected ({selectedSupplierIds.length})</button>
      {sendResult && (
        <div className="mb-3 flex flex-col gap-1">
          {sendResult.map((r) => (
            <div key={r.supplierId} style={{ color: r.delivered ? "#166534" : C.danger }} className="text-xs">{r.supplierName || r.supplierId}: {r.delivered ? "sent" : r.reason}</div>
          ))}
        </div>
      )}
      {(po.quotation_requests || []).length > 0 && (
        <div style={{ color: C.textSoft }} className="text-xs mb-3">Already requested from: {po.quotation_requests.map((q) => q.supplierName).join(", ")}</div>
      )}

      <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-1 mt-3">Award To</div>
      <div className="mb-3" style={{ maxWidth: 220 }}>
        <CustomSelect value={po.supplier_id || ""} onChange={assignAwarded} placeholder="Not yet decided" options={shortlisted.map((s) => ({ value: s.id, label: s.name }))} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between" style={{ borderColor: C.border }} />
      </div>

      <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-1">Payment Terms</div>
      <div className="mb-3" style={{ maxWidth: 220 }}>
        <CustomSelect value={po.payment_terms} onChange={setPaymentTerms} options={PAYMENT_TERMS.map((t) => ({ value: t, label: t }))} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between" style={{ borderColor: C.border }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <div style={{ color: C.textSoft }} className="text-xs font-semibold mb-1">Supplier Invoice</div>
          {po.supplier_invoice_url
            ? <a href={po.supplier_invoice_url} target="_blank" rel="noreferrer" style={{ color: C.cyan }} className="text-xs underline">View attached file</a>
            : <FileDropzone label="Drop invoice here" onUploaded={(f) => attachFile("supplier_invoice_url", f.url)} />}
        </div>
        <div>
          <div style={{ color: C.textSoft }} className="text-xs font-semibold mb-1">Delivery Note</div>
          {po.delivery_note_url
            ? <a href={po.delivery_note_url} target="_blank" rel="noreferrer" style={{ color: C.cyan }} className="text-xs underline">View attached file</a>
            : <FileDropzone accept="image/*,application/pdf" label="Drop or photograph the delivery note" onUploaded={(f) => attachFile("delivery_note_url", f.url)} />}
        </div>
      </div>

      <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-1">Negotiation Notes</div>
      <div className="flex flex-col gap-1 mb-2 max-h-32 overflow-y-auto">
        {(po.negotiation_log || []).map((n) => <div key={n.id} style={{ color: C.ink }} className="text-xs">{n.text}</div>)}
        {(po.negotiation_log || []).length === 0 && <div style={{ color: C.textSoft }} className="text-xs">No notes yet.</div>}
      </div>
      <form onSubmit={addNote} className="flex gap-2 mb-4">
        <input placeholder="Add a note…" value={noteText} onChange={(e) => setNoteText(e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-2 py-1.5 text-xs" />
        <button type="submit" style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-3 rounded-lg">Add</button>
      </form>

      <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-1">Receive Items (scan to verify)</div>
      <div className="flex flex-col gap-1 mb-3">
        {po.items.map((it) => {
          const done = Number(it.received_qty || 0) >= Number(it.qty);
          return (
            <div key={it.id} className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <span style={{ color: done ? "#166534" : C.ink }} className="flex items-center gap-1">{done ? <CheckCircle2 size={13} /> : <Circle size={13} />} {it.name} ({it.received_qty || 0}/{it.qty})</span>
              {!done && <button type="button" onClick={() => setScanningItemId(it.id)} style={{ color: C.cyan }} className="font-semibold flex items-center gap-1"><Camera size={13} /> Scan</button>}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button onClick={() => api.receivePurchaseOrder(po.id).then(load)} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-3 py-2 rounded-lg">Receive All (no scan)</button>
        {allReceived && <button onClick={finalize} style={{ background: C.cyan }} className="text-white text-xs font-semibold px-3 py-2 rounded-lg">Finalize as Received</button>}
      </div>

      {scanningItemId && <Suspense fallback={null}><BarcodeScannerModal onDetected={scanReceive} onClose={() => setScanningItemId(null)} /></Suspense>}
    </div>
  );
}

export default function PurchaseOrders() {
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [poCategories, setPoCategories] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([{ name: "", spec: "", qty: 1 }]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = () => Promise.all([api.getPurchaseOrders(), api.getSuppliers(), api.getCategories("purchase_order"), api.getPOCatalog()])
    .then(([p, s, c, cat]) => { setPos(p); setSuppliers(s); setPoCategories(c); setCatalog(cat); if (c.length && !selectedCategory) setSelectedCategory(c[0].name); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const quickAddSupplier = async (form) => { const s = await api.addSupplier({ ...form, shortlisted: true }); load(); return s; };

  const addFromCatalog = (item) => setItems((prev) => {
    const withoutBlank = prev.filter((it) => it.name.trim());
    return [...withoutBlank, { name: item.name, spec: item.spec, qty: 1 }];
  });

  const addRow = () => setItems([...items, { name: "", spec: "", qty: 1 }]);
  const updateRow = (i, field, val) => setItems(items.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
  const removeRow = (i) => setItems(items.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    await api.createPurchaseOrder({ items: items.filter((it) => it.name) });
    setItems([{ name: "", spec: "", qty: 1 }]);
    setOpen(false);
    load();
  };

  const decide = async (id, status) => { await api.decidePurchaseOrder(id, status); load(); };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Purchase Orders</h1>
        <button onClick={() => setOpen(true)} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ New Purchase Order</button>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {pos.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No purchase orders yet.</div>}
        {pos.map((po, i) => (
          <div key={po.id} className="px-5 py-4" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <div style={{ color: C.ink }} className="text-sm font-semibold">PO-{po.id.slice(-5).toUpperCase()} · {po.items.length} item(s)</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ background: C.amberBg, color: C.amberDeep }} className="text-xs font-medium px-2.5 py-1 rounded-full">{po.status}</span>
                {po.status !== "Pending Approval" && <button onClick={() => setExpanded(expanded === po.id ? null : po.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>{expanded === po.id ? "Hide" : "Manage"}</button>}
              </div>
            </div>
            <div style={{ color: C.textSoft }} className="text-xs mb-2">{po.items.map((it) => `${it.name} x${it.qty}`).join(", ")}</div>
            {po.status === "Pending Approval" && (
              <div className="flex gap-2">
                <button onClick={() => decide(po.id, "Approved")} className="text-xs font-semibold" style={{ color: C.cyan }}>Approve</button>
                <button onClick={() => decide(po.id, "Rejected")} className="text-xs font-semibold" style={{ color: C.danger }}>Reject</button>
              </div>
            )}
            {expanded === po.id && po.status !== "Pending Approval" && (
              <PODetail po={po} suppliers={suppliers} load={load} quickAddSupplier={quickAddSupplier} />
            )}
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-lg rounded-xl p-6 max-h-[85vh] overflow-y-auto">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">New Purchase Order</div>

            {poCategories.length > 0 && (
              <>
                <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-2">Catalog — tap to add</div>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {poCategories.map((c) => (
                    <button key={c.id} type="button" onClick={() => setSelectedCategory(c.name)} style={{ background: selectedCategory === c.name ? C.cyan : "#fff", color: selectedCategory === c.name ? "#fff" : C.ink, border: `1px solid ${C.border}` }} className="text-xs font-semibold px-3 py-1.5 rounded-full">{c.name}</button>
                  ))}
                </div>
                <div style={{ border: `1px solid ${C.border}` }} className="rounded-lg overflow-hidden mb-4 max-h-32 overflow-y-auto">
                  {catalog.filter((c) => c.category === selectedCategory).map((c) => (
                    <button key={c.id} type="button" onClick={() => addFromCatalog(c)} className="w-full text-left px-3 py-2 text-sm hover:bg-black/5" style={{ borderTop: `1px solid ${C.border}` }}>
                      {c.name} {c.spec && <span style={{ color: C.textSoft }}>— {c.spec}</span>}
                    </button>
                  ))}
                  {catalog.filter((c) => c.category === selectedCategory).length === 0 && (
                    <div className="px-3 py-2 text-xs" style={{ color: C.textSoft }}>No catalog items in this category yet — manage the catalog from Settings, or just type items below.</div>
                  )}
                </div>
              </>
            )}

            <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-2">Items</div>
            {items.map((it, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2 mb-2 pb-2 sm:pb-0" style={{ borderBottom: "1px solid #F1F2F4" }}>
                <input placeholder="Item name" value={it.name} onChange={(e) => updateRow(i, "name", e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-2 py-1.5 text-sm" />
                <input placeholder="Spec" value={it.spec} onChange={(e) => updateRow(i, "spec", e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-2 py-1.5 text-sm" />
                <div className="flex gap-2">
                  <input type="number" value={it.qty} onChange={(e) => updateRow(i, "qty", e.target.value)} style={{ borderColor: C.border, width: 70 }} className="border rounded-lg px-2 py-1.5 text-sm" />
                  <button type="button" onClick={() => removeRow(i)} style={{ color: C.danger }} className="text-sm px-2"><X size={14} /></button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addRow} className="text-xs font-semibold mb-4" style={{ color: C.cyan }}>+ Add another item</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Submit Order</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
