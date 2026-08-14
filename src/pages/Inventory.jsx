import React, { useState, useEffect, lazy, Suspense } from "react";
import { api } from "../api.js";
import { useUser, C } from "../App.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import { Camera, Package, Plus } from "lucide-react";
import { PageHeader, StatCard, ListRow, StatusPill, Button, Modal, FieldLabel, EmptyState, LoadingState } from "../components/ui.jsx";

const BarcodeScannerModal = lazy(() => import("../components/BarcodeScannerModal.jsx"));

const money = (n) => "TZS " + Number(n || 0).toLocaleString();
const blank = { name: "", category: "", barcode: "", qty: "", reorderLevel: "", costPrice: "", sellPrice: "", sellable: false };

export default function Inventory() {
  const { user } = useUser();
  const canEdit = user?.role === "owner" || user?.role === "manager";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const load = () => Promise.all([api.getProducts(), api.getCategories("product")]).then(([p, c]) => { setProducts(p); setCategories(c); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const scanBarcode = (code) => { setForm((f) => ({ ...f, barcode: code })); setScannerOpen(false); };

  const openAdd = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name, category: p.category || "", barcode: p.barcode || "", qty: p.qty, reorderLevel: p.reorder_level, costPrice: p.cost_price, sellPrice: p.sell_price || "", sellable: !!p.sellable });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, qty: Number(form.qty), reorderLevel: Number(form.reorderLevel), costPrice: Number(form.costPrice), sellPrice: Number(form.sellPrice) };
    if (editing) await api.updateProduct(editing, payload);
    else await api.addProduct(payload);
    setForm(blank);
    setEditing(null);
    setOpen(false);
    load();
  };

  if (loading) return <LoadingState />;

  const consumables = products.filter((p) => !p.sellable);
  const retail = products.filter((p) => p.sellable);
  const stockValue = products.reduce((s, p) => s + Number(p.qty || 0) * Number(p.cost_price || 0), 0);

  const ProductList = (list, emptyMsg) => list.length === 0 ? (
    <div className="bg-white rounded-xl p-4 text-sm" style={{ color: C.textSoft }}>{emptyMsg}</div>
  ) : (
    <div className="flex flex-col gap-2">
      {list.map((p) => {
        const low = Number(p.qty) <= Number(p.reorder_level);
        return (
          <ListRow
            key={p.id}
            icon={Package}
            tone={low ? "danger" : "cyan"}
            title={p.name}
            subtitle={p.qty + " on hand · reorder at " + p.reorder_level + " · cost " + money(p.cost_price) + (p.sellable ? " · sell " + money(p.sell_price) : "")}
            trailing={
              <div className="flex items-center gap-3 flex-wrap justify-end">
                {low && <StatusPill label="Low stock" tone="danger" />}
                {canEdit && <button onClick={() => openEdit(p)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>}
              </div>
            }
          />
        );
      })}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={products.length + " products tracked"}
        action={canEdit && <Button onClick={openAdd}><span className="flex items-center gap-1.5"><Plus size={16} />Add product</span></Button>}
      />

      <div className="mb-6 max-w-xs">
        <StatCard label="Stock value (at cost)" value={money(stockValue)} icon={Package} tone="ink" />
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Consumables (internal use)</div>
      <div className="mb-6">{ProductList(consumables, "No internal-use products tracked yet.")}</div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Retail (sellable to customers)</div>
      {ProductList(retail, "No retail products yet.")}

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null); }}>
        <form onSubmit={submit}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">{editing ? "Edit product" : "Add product"}</div>
          <FieldLabel>Name</FieldLabel>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Category</FieldLabel>
          <div className="mb-3">
            <CustomSelect value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={categories.map((c) => ({ value: c.name, label: c.name }))} />
          </div>
          <FieldLabel>Barcode (optional)</FieldLabel>
          <div className="flex flex-wrap gap-2 mb-3">
            <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} style={{ borderColor: C.border, minWidth: 160 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            <button type="button" onClick={() => setScannerOpen(true)} style={{ border: "1px solid " + C.border, color: C.ink }} className="px-3 rounded-lg flex items-center"><Camera size={15} /></button>
          </div>
          <FieldLabel>Quantity on hand</FieldLabel>
          <input value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Reorder level</FieldLabel>
          <input value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Cost price (TZS)</FieldLabel>
          <input value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Sell price (TZS)</FieldLabel>
          <input value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <label className="flex items-center gap-2 text-sm mb-4" style={{ color: C.ink }}>
            <input type="checkbox" checked={form.sellable} onChange={(e) => setForm({ ...form, sellable: e.target.checked })} /> Sellable to customers
          </label>
          <div className="flex gap-2 mt-1">
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setEditing(null); }} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editing ? "Save changes" : "Save"}</Button>
          </div>
        </form>
      </Modal>

      {scannerOpen && <Suspense fallback={null}><BarcodeScannerModal onDetected={scanBarcode} onClose={() => setScannerOpen(false)} /></Suspense>}
    </div>
  );
}
