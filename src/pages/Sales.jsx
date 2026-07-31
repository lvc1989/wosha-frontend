import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useBranch } from "../App.jsx";
import BarcodeScannerModal from "../components/BarcodeScannerModal.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", successBg: "#E6F4EA" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();

export default function Sales() {
  const { loc, locations } = useBranch();
  const [category, setCategory] = useState("services");
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [basket, setBasket] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [done, setDone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState("");

  const branchId = loc !== "all" ? loc : locations[0]?.id;

  const scanToAdd = async (code) => {
    setScannerOpen(false);
    setScanError("");
    try {
      const p = await api.getProductByBarcode(code);
      addToBasket(p, "product");
    } catch (err) {
      setScanError(err.message);
    }
  };

  useEffect(() => {
    Promise.all([api.getServices(), api.getProducts(branchId)])
      .then(([s, p]) => { setServices(s); setProducts(p.filter((x) => x.sellable)); })
      .finally(() => setLoading(false));
  }, [branchId]);

  const addToBasket = (item, type) => {
    setBasket((prev) => {
      const existing = prev.find((b) => b.refId === item.id && b.type === type);
      if (existing) return prev.map((b) => b === existing ? { ...b, qty: b.qty + 1 } : b);
      return [...prev, { refId: item.id, type, name: item.name, rate: type === "service" ? Number(item.price) : Number(item.sell_price), qty: 1 }];
    });
  };
  const changeQty = (i, delta) => setBasket((prev) => prev.map((b, idx) => idx === i ? { ...b, qty: Math.max(1, b.qty + delta) } : b));
  const removeItem = (i) => setBasket((prev) => prev.filter((_, idx) => idx !== i));
  const total = basket.reduce((s, b) => s + b.rate * b.qty, 0);

  const finalize = async (method) => {
    if (!basket.length || !branchId) return;
    const items = basket.map((b) => ({ name: b.name, rate: b.rate, qty: b.qty }));
    let customerId = null;
    if (customerName.trim()) {
      const cust = await api.addCustomer({ name: customerName, phone: customerPhone, asset: plate ? { label: "Vehicle plate", detail: plate } : undefined });
      customerId = cust.id;
    }
    const booking = await api.addBooking({ locationId: branchId, customerId, vehiclePlate: plate || "Walk-in / Counter Sale", serviceIds: basket.filter((b) => b.type === "service").map((b) => b.refId) });
    const invoice = await api.createInvoice({ bookingId: booking.id, locationId: branchId, items });
    await api.payInvoice(invoice.id, method);
    // Deduct sold product stock
    for (const b of basket.filter((x) => x.type === "product")) {
      await api.adjustProductQty(b.refId, -b.qty);
    }
    setDone({ total, method });
    setBasket([]); setCustomerName(""); setCustomerPhone(""); setPlate("");
  };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <h1 style={{ color: C.ink }} className="text-xl font-bold mb-6">Record Sale</h1>
      {done && (
        <div style={{ background: C.successBg, color: "#166534" }} className="rounded-lg px-4 py-3 text-sm mb-6 flex items-center justify-between">
          <span>Sale complete — {money(done.total)} via {done.method}.</span>
          <button onClick={() => setDone(null)} className="text-xs font-semibold underline">Dismiss</button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}`, width: "fit-content" }}>
              <button onClick={() => setCategory("services")} style={{ background: category === "services" ? C.cyan : "#fff", color: category === "services" ? "#fff" : C.ink }} className="px-4 py-2 text-sm font-semibold">Services</button>
              <button onClick={() => setCategory("products")} style={{ background: category === "products" ? C.cyan : "#fff", color: category === "products" ? "#fff" : C.ink }} className="px-4 py-2 text-sm font-semibold">Products</button>
            </div>
            {category === "products" && (
              <button onClick={() => setScannerOpen(true)} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-sm font-semibold px-3 py-2 rounded-lg">📷 Scan Product</button>
            )}
          </div>
          {scanError && <div style={{ color: "#DC2626" }} className="text-xs mb-2">{scanError}</div>}
          <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
            {category === "services" && services.map((s, i) => (
              <button key={s.id} onClick={() => addToBasket(s, "service")} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-black/5" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
                <span style={{ color: C.ink }} className="text-sm">{s.name}</span>
                <span style={{ color: "#1745B3" }} className="text-sm font-semibold">{money(s.price)}</span>
              </button>
            ))}
            {category === "products" && products.map((p, i) => (
              <button key={p.id} onClick={() => addToBasket(p, "product")} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-black/5" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
                <span style={{ color: C.ink }} className="text-sm">{p.name}</span>
                <span style={{ color: "#1745B3" }} className="text-sm font-semibold">{money(p.sell_price)}</span>
              </button>
            ))}
            {category === "products" && products.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No sellable products for this branch.</div>}
          </div>
        </div>
        <div>
          <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Basket</div>
          <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-4 mb-3">
            <input placeholder="Walk-in customer name (optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" />
            {customerName && <input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" />}
            <input placeholder="Vehicle plate (optional)" value={plate} onChange={(e) => setPlate(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden mb-3">
            {basket.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>Empty — tap items to add them.</div>}
            {basket.map((b, i) => (
              <div key={i} className="px-4 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: C.ink }} className="text-sm font-medium">{b.name}</span>
                  <button onClick={() => removeItem(i)} style={{ color: "#DC2626" }} className="text-xs">✕</button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeQty(i, -1)} style={{ border: `1px solid ${C.border}` }} className="w-6 h-6 rounded text-sm">-</button>
                  <span className="text-sm">{b.qty}</span>
                  <button onClick={() => changeQty(i, 1)} style={{ border: `1px solid ${C.border}` }} className="w-6 h-6 rounded text-sm">+</button>
                  <span style={{ color: C.textSoft }} className="text-xs ml-auto">{money(b.rate * b.qty)}</span>
                </div>
              </div>
            ))}
          </div>
          {basket.length > 0 && (
            <>
              <div className="flex justify-between mb-3"><span style={{ color: C.ink }} className="font-bold">Total</span><span style={{ color: C.ink }} className="font-bold">{money(total)}</span></div>
              <div className="flex flex-col gap-2">
                {["Cash", "Control Number", "Mobile Money"].map((m) => (
                  <button key={m} onClick={() => finalize(m)} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="py-2 rounded-lg text-sm font-semibold">{m}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {scannerOpen && <BarcodeScannerModal onDetected={scanToAdd} onClose={() => setScannerOpen(false)} />}
    </div>
  );
}
