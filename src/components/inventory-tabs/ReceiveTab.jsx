import React, { useState, useEffect, lazy, Suspense } from "react";
import { api } from "../../api.js";
import { useBranch, C } from "../../App.jsx";
const BarcodeScannerModal = lazy(() => import("../BarcodeScannerModal.jsx"));
import { Camera, Flag, Package } from "lucide-react";
import { ListRow, StatusPill, Button, LoadingState } from "../ui.jsx";

// Original Store.jsx, exactly — only the outer PageHeader was removed.
export default function ReceiveTab() {
  const { loc } = useBranch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barcode, setBarcode] = useState("");
  const [found, setFound] = useState(null);
  const [receiveQty, setReceiveQty] = useState("1");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const load = () => api.getProducts(loc).then(setProducts).finally(() => setLoading(false));
  useEffect(() => { load(); }, [loc]);

  const lookupCode = async (code) => {
    setError(""); setFound(null); setMessage(""); setScannerOpen(false);
    setBarcode(code);
    try {
      const p = await api.getProductByBarcode(code);
      setFound(p);
    } catch (err) {
      setError(err.message);
    }
  };

  const receiveStock = async () => {
    await api.adjustProductQty(found.id, Number(receiveQty));
    setMessage("Added " + receiveQty + " to " + found.name + ".");
    setFound(null); setBarcode(""); setReceiveQty("1");
    load();
  };

  const requestRestock = async (p) => {
    const qty = Math.max(1, Number(p.par_level || p.reorder_level * 2) - Number(p.qty));
    await api.createPurchaseOrder({ locationId: p.location_id, items: [{ name: p.name, spec: (p.unit || "") + " · restock request", qty, rate: 0 }] });
    setMessage("Restock request created for " + p.name + " — see Purchase Orders for approval.");
  };

  const flagRunningOut = async (p) => {
    await api.requestRestock(p.id, p.name + " flagged by staff — " + p.qty + " " + p.unit + " left");
    setMessage("Flagged \"" + p.name + "\" as running out — the owner and branch manager will see this in their reminders.");
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="bg-white rounded-2xl p-5 mb-6">
        <div style={{ color: C.ink }} className="text-sm font-semibold mb-3">Scan to receive stock</div>
        <form onSubmit={(e) => { e.preventDefault(); lookupCode(barcode); }} className="flex flex-wrap gap-2 mb-2">
          <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Enter or scan barcode" style={{ borderColor: C.border, minWidth: 160 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button type="button" onClick={() => setScannerOpen(true)} style={{ border: "1px solid " + C.border, color: C.ink }} className="text-sm font-semibold px-3 rounded-lg flex items-center gap-1.5"><Camera size={15} /> Scan</button>
          <Button type="submit">Look up</Button>
        </form>
        {error && <div style={{ color: C.danger }} className="text-xs">{error}</div>}
        {message && <div style={{ color: "#3B6D11" }} className="text-xs">{message}</div>}
        {found && (
          <div style={{ background: "#EAF3DE" }} className="rounded-lg p-3 mt-2 flex items-center gap-3">
            <div className="flex-1">
              <div style={{ color: C.ink }} className="text-sm font-semibold">{found.name}</div>
              <div style={{ color: C.textSoft }} className="text-xs">Currently {found.qty} {found.unit} on hand</div>
            </div>
            <input type="number" value={receiveQty} onChange={(e) => setReceiveQty(e.target.value)} style={{ borderColor: C.border, width: 70 }} className="border rounded-lg px-2 py-1.5 text-sm" />
            <Button onClick={receiveStock}>Add stock</Button>
          </div>
        )}
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">All stock</div>
      <div className="flex flex-col gap-2">
        {products.map((p) => {
          const low = Number(p.qty) <= Number(p.reorder_level);
          return (
            <ListRow
              key={p.id}
              icon={Package}
              tone={low ? "amber" : "cyan"}
              title={p.name}
              subtitle={"Barcode: " + (p.barcode || "none") + " · " + p.qty + " " + p.unit}
              trailing={
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {low && <StatusPill label="Low stock" tone="amber" />}
                  {low && <button onClick={() => requestRestock(p)} className="text-xs font-semibold" style={{ color: C.cyan }}>Request restock</button>}
                  {!low && <button onClick={() => flagRunningOut(p)} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.textSoft }}><Flag size={13} /> Flag as running out</button>}
                </div>
              }
            />
          );
        })}
      </div>
      {scannerOpen && <Suspense fallback={null}><BarcodeScannerModal onDetected={lookupCode} onClose={() => setScannerOpen(false)} /></Suspense>}
    </div>
  );
}
