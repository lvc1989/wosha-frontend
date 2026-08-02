import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useBranch } from "../App.jsx";
import BarcodeScannerModal from "../components/BarcodeScannerModal.jsx";
import { Camera, Flag } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", dangerBg: "#FEE2E2", danger: "#DC2626", successBg: "#E6F4EA" };

export default function Store() {
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
    setMessage(`Added ${receiveQty} to ${found.name}.`);
    setFound(null); setBarcode(""); setReceiveQty("1");
    load();
  };

  const requestRestock = async (p) => {
    const qty = Math.max(1, Number(p.par_level || p.reorder_level * 2) - Number(p.qty));
    await api.createPurchaseOrder({ locationId: p.location_id, items: [{ name: p.name, spec: `${p.unit || ""} · restock request`, qty, rate: 0 }] });
    setMessage(`Restock request created for ${p.name} — see Purchase Orders for approval.`);
  };

  const flagRunningOut = async (p) => {
    await api.requestRestock(p.id, `${p.name} flagged by staff — ${p.qty} ${p.unit} left`);
    setMessage(`Flagged "${p.name}" as running out — the owner and branch manager will see this in their reminders.`);
  };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <h1 style={{ color: C.ink }} className="text-xl font-bold mb-6">Store</h1>

      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-5 mb-6">
        <div style={{ color: C.ink }} className="text-sm font-semibold mb-3">Scan to Receive Stock</div>
        <form onSubmit={(e) => { e.preventDefault(); lookupCode(barcode); }} className="flex gap-2 mb-2">
          <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Enter or scan barcode" style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button type="button" onClick={() => setScannerOpen(true)} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-sm font-semibold px-3 rounded-lg flex items-center gap-1.5"><Camera size={15} /> Scan</button>
          <button type="submit" style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 rounded-lg">Look Up</button>
        </form>
        {error && <div style={{ color: C.danger }} className="text-xs">{error}</div>}
        {message && <div style={{ color: "#166534" }} className="text-xs">{message}</div>}
        {found && (
          <div style={{ background: C.successBg }} className="rounded-lg p-3 mt-2 flex items-center gap-3">
            <div className="flex-1">
              <div style={{ color: C.ink }} className="text-sm font-semibold">{found.name}</div>
              <div style={{ color: C.textSoft }} className="text-xs">Currently {found.qty} {found.unit} on hand</div>
            </div>
            <input type="number" value={receiveQty} onChange={(e) => setReceiveQty(e.target.value)} style={{ borderColor: C.border, width: 70 }} className="border rounded-lg px-2 py-1.5 text-sm" />
            <button onClick={receiveStock} style={{ background: C.cyan }} className="text-white text-xs font-semibold px-3 py-2 rounded-lg">Add Stock</button>
          </div>
        )}
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">All stock</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {products.map((p, i) => {
          const low = Number(p.qty) <= Number(p.reorder_level);
          return (
            <div key={p.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
              <div>
                <div style={{ color: C.ink }} className="text-sm font-semibold">{p.name}</div>
                <div style={{ color: C.textSoft }} className="text-xs">Barcode: {p.barcode || "none"} · {p.qty} {p.unit}</div>
              </div>
              <div className="flex items-center gap-2">
                {low && <span style={{ background: C.dangerBg, color: C.danger }} className="text-xs font-medium px-2.5 py-1 rounded-full">Low stock</span>}
                {low && <button onClick={() => requestRestock(p)} className="text-xs font-semibold" style={{ color: C.cyan }}>Request Restock</button>}
                {!low && <button onClick={() => flagRunningOut(p)} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.textSoft }}><Flag size={13} /> Flag as Running Out</button>}
              </div>
            </div>
          );
        })}
      </div>
      {scannerOpen && <BarcodeScannerModal onDetected={lookupCode} onClose={() => setScannerOpen(false)} />}
    </div>
  );
}
