import React, { useState, useEffect, lazy, Suspense } from "react";
import { api } from "../api.js";
import { useBranch, C } from "../App.jsx";
const BarcodeScannerModal = lazy(() => import("../components/BarcodeScannerModal.jsx"));
import CustomSelect from "../components/CustomSelect.jsx";
import { Camera, X, ScanLine, Store } from "lucide-react";
import { PageHeader, Button, Modal, FieldLabel, LoadingState } from "../components/ui.jsx";
import { useHardwareScanner } from "../hooks/useHardwareScanner.js";

const money = (n) => "TZS " + Number(n || 0).toLocaleString();

export default function Sales() {
  const { loc, locations } = useBranch();
  const [category, setCategory] = useState("services");
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [basket, setBasket] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [walkIn, setWalkIn] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInEmail, setWalkInEmail] = useState("");
  const [plate, setPlate] = useState("");
  const [companyMode, setCompanyMode] = useState(false);
  const [companyForm, setCompanyForm] = useState({ companyName: "", companyTIN: "", companyAddress: "" });

  const [payOpen, setPayOpen] = useState(false);
  const [done, setDone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState("product"); // "product" | "plate"
  const [scanMsg, setScanMsg] = useState("");

  // The top bar's branch selection is now the single, persistent source of
  // truth (it survives logout/login) — this page no longer keeps its own
  // separate branch choice. If someone genuinely hasn't picked a real branch
  // yet (loc is still "all"), the gate below asks once, and that choice
  // updates the top bar directly, so it's remembered everywhere from then on.
  const activeBranchId = loc !== "all" ? loc : "";
  const activeBranchName = locations.find((l) => l.id === activeBranchId)?.name || "";

  useEffect(() => {
    Promise.all([api.getServices(), api.getProducts(activeBranchId), api.getCustomers()])
      .then(([s, p, c]) => { setServices(s); setProducts(p.filter((x) => x.sellable)); setCustomers(c); })
      .finally(() => setLoading(false));
  }, [activeBranchId]);

  const addToBasket = (item, type) => {
    setBasket((prev) => {
      const existing = prev.find((b) => b.refId === item.id && b.type === type);
      if (existing) return prev.map((b) => b === existing ? { ...b, qty: b.qty + 1 } : b);
      return [...prev, { refId: item.id, type, name: item.name, rate: type === "service" ? Number(item.price) : Number(item.sell_price), qty: 1 }];
    });
  };

  // Shared by both scan sources — the camera modal and a real hardware/POS
  // barcode scanner. Whichever one reads the code, resolution works the same
  // way: try it as a product barcode, then as a payment code, then give up
  // with a clear message. Kept as one function so the two paths can never
  // silently drift apart from each other.
  const resolveScannedCode = async (code) => {
    setScanMsg("");
    try {
      const p = await api.getProductByBarcode(code);
      if (!p.sellable) { setScanMsg("\"" + p.name + "\" is marked internal-use only and can't be sold."); }
      else { addToBasket(p, "product"); setScanMsg("Added: " + p.name); }
    } catch {
      try {
        const pc = await api.lookupPaymentCode(code);
        if (pc.service_id) {
          const svc = services.find((s) => s.id === pc.service_id);
          if (svc) { addToBasket(svc, "service"); setScanMsg("Added: " + svc.name); }
        } else if (pc.product_id) {
          const prod = products.find((p) => p.id === pc.product_id);
          if (prod) { addToBasket(prod, "product"); setScanMsg("Added: " + prod.name); }
        } else {
          setScanMsg("\"" + pc.label + "\" is a custom-amount code — add the item manually.");
        }
      } catch {
        setScanMsg("Nothing matches that code — not a known product or payment code.");
      }
    }
    setTimeout(() => setScanMsg(""), 4000);
  };

  const scanToAdd = async (code) => {
    setScannerOpen(false);

    if (scanMode === "plate") {
      setScanMsg("");
      setPlate(code);
      try {
        const { customer, created } = await api.findOrCreateCustomerByPlate(code);
        if (created) setCustomers((prev) => [customer, ...prev]);
        setCustomerId(customer.id);
        setWalkIn("");
        setScanMsg(created
          ? "New customer created from this plate — you can fill in their name and phone later from Customers."
          : "Recognized returning customer: " + customer.name);
      } catch (err) {
        setScanMsg(err.message || "Couldn't process that plate scan — try again.");
      }
      setTimeout(() => setScanMsg(""), 5000);
      return;
    }

    resolveScannedCode(code);
  };

  // A real hardware/POS barcode scanner "types" the code into the page like a
  // keyboard, ending with Enter — it isn't a camera or a modal, it just works
  // in the background the whole time this page is open. Every code it reads is
  // treated as a product/payment-code scan (a physical scanner reads barcodes,
  // not vehicle plates — plate capture stays camera-only, via the button below).
  useHardwareScanner(resolveScannedCode, { enabled: !loading });

  const openScanner = (mode) => { setScanMode(mode); setScannerOpen(true); };

  const changeQty = (i, delta) => setBasket((prev) => prev.map((b, idx) => idx === i ? { ...b, qty: Math.max(1, b.qty + delta) } : b));
  const removeItem = (i) => setBasket((prev) => prev.filter((_, idx) => idx !== i));
  const total = basket.reduce((s, b) => s + b.rate * b.qty, 0);

  const finalizeSale = async (method) => {
    if (!basket.length || !activeBranchId) return;
    let finalCustomerId = null;
    if (!companyMode) {
      if (walkIn.trim()) {
        const cust = await api.addCustomer({ name: walkIn, phone: walkInPhone, email: walkInEmail || undefined });
        finalCustomerId = cust.id;
      } else {
        finalCustomerId = customerId || null;
      }
    }
    const items = basket.map((b) => ({ name: b.name, rate: b.rate, qty: b.qty }));
    const serviceIds = basket.filter((b) => b.type === "service").map((b) => b.refId);
    const booking = await api.addBooking({ locationId: activeBranchId, customerId: finalCustomerId, vehiclePlate: plate || "Walk-in / Counter Sale", serviceIds });

    const isInvoiceOnly = method === "Invoice (Company)";
    const invoice = await api.createInvoice({
      bookingId: booking.id, locationId: activeBranchId, items,
      billTo: companyMode ? companyForm.companyName : undefined,
      companyTIN: companyMode ? companyForm.companyTIN : undefined,
      companyAddress: companyMode ? companyForm.companyAddress : undefined,
    });
    if (!isInvoiceOnly) await api.payInvoice(invoice.id, method);

    for (const b of basket.filter((x) => x.type === "product")) {
      await api.adjustProductQty(b.refId, -b.qty);
    }

    setDone({ total, method, controlNumber: invoice.control_number, invoiceGenerated: isInvoiceOnly });
    setBasket([]); setWalkIn(""); setWalkInPhone(""); setWalkInEmail(""); setPlate(""); setPayOpen(false);
    setCompanyMode(false); setCompanyForm({ companyName: "", companyTIN: "", companyAddress: "" });
  };

  if (loading) return <LoadingState />;

  if (loc === "all") {
    return (
      <div>
        <PageHeader title="Record sale" subtitle="Services, products, or a mix of both" />
        <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-auto">
          <div style={{ background: "#E6F1FB" }} className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store size={22} color="#185FA5" />
          </div>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-base font-semibold mb-2">Which branch is this sale at?</div>
          <div style={{ color: C.textSoft }} className="text-sm mb-5">Every branch has its own stock, so pick the real branch you're selling from — "All Branches" up top is for viewing reports across every location, not for making a sale.</div>
          <CustomSelect
            value=""
            onChange={setLoc}
            placeholder="Choose a branch to start"
            options={locations.map((l) => ({ value: l.id, label: l.name }))}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Record sale" subtitle={"Selling from " + (activeBranchName || "—") + " · change branch from the top bar"} />
      {done && (
        <div style={{ background: "#EAF3DE", color: "#3B6D11" }} className="rounded-lg px-4 py-3 text-sm mb-6 flex items-center justify-between gap-2 flex-wrap">
          <span>{done.invoiceGenerated ? "Invoice generated" : "Paid via " + done.method} — {money(done.total)}. Control #{done.controlNumber}.</span>
          <button onClick={() => setDone(null)} className="text-xs font-semibold underline">Dismiss</button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid " + C.border, width: "fit-content" }}>
              <button onClick={() => setCategory("services")} style={{ background: category === "services" ? C.cyan : "#fff", color: category === "services" ? "#fff" : C.ink }} className="px-4 py-2 text-sm font-semibold">Services</button>
              <button onClick={() => setCategory("products")} style={{ background: category === "products" ? C.cyan : "#fff", color: category === "products" ? "#fff" : C.ink }} className="px-4 py-2 text-sm font-semibold">Products</button>
            </div>
            {category === "products" && (
              <button onClick={() => openScanner("product")} style={{ border: "1px solid " + C.border, color: C.ink }} className="text-sm font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5"><Camera size={15} /> Scan product</button>
            )}
          </div>
          {scanMsg && <div style={{ background: "#FAEEDA", color: "#854F0B" }} className="rounded-lg px-3 py-2 text-xs mb-3">{scanMsg}</div>}
          <div className="bg-white rounded-2xl overflow-hidden">
            {category === "services" && services.map((s, i) => (
              <button key={s.id} onClick={() => addToBasket(s, "service")} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-black/5" style={{ borderTop: i === 0 ? "none" : "1px solid " + C.border }}>
                <span style={{ color: C.ink }} className="text-sm font-medium">{s.name}</span>
                <span style={{ color: "#185FA5" }} className="text-sm font-semibold">{money(s.price)}</span>
              </button>
            ))}
            {category === "products" && products.map((p, i) => (
              <button key={p.id} onClick={() => addToBasket(p, "product")} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-black/5" style={{ borderTop: i === 0 ? "none" : "1px solid " + C.border }}>
                <span style={{ color: C.ink }} className="text-sm font-medium">{p.name}</span>
                <div className="flex items-center gap-3 flex-wrap">
                  <span style={{ color: C.textSoft }} className="text-xs">{p.qty} in stock</span>
                  <span style={{ color: "#185FA5" }} className="text-sm font-semibold">{money(p.sell_price)}</span>
                </div>
              </button>
            ))}
            {category === "products" && products.length === 0 && (
              <div className="p-5 text-sm text-center" style={{ color: C.textSoft }}>
                No sellable products in {activeBranchName || "this branch"}'s stock yet.<br />
                Add stock under <span style={{ color: C.cyan, fontWeight: 600 }}>Inventory</span>, or switch to a branch that already has some.
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Basket</div>
          <div className="bg-white rounded-2xl p-4">
            {!companyMode ? (
              <>
                <FieldLabel>Customer (optional — pick, type, or just scan the plate below)</FieldLabel>
                <div className="mb-2">
                  <CustomSelect value={customerId} onChange={setCustomerId} placeholder="No customer selected" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
                </div>
                <FieldLabel>Or walk-in name (optional)</FieldLabel>
                <input value={walkIn} onChange={(e) => setWalkIn(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" />
                {walkIn.trim() && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <input placeholder="Phone" value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)} style={{ borderColor: C.border }} className="border rounded-lg px-3 py-2 text-sm" />
                    <input placeholder="Email (optional)" value={walkInEmail} onChange={(e) => setWalkInEmail(e.target.value)} style={{ borderColor: C.border }} className="border rounded-lg px-3 py-2 text-sm" />
                  </div>
                )}
                <FieldLabel>Vehicle plate / reference ID (optional)</FieldLabel>
                <div className="flex flex-wrap gap-2 mb-1">
                  <input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="e.g. T 123 ABC" style={{ borderColor: C.border, minWidth: 160 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                  <button type="button" onClick={() => openScanner("plate")} style={{ border: "1px solid " + C.border, color: C.ink }} className="px-3 rounded-lg flex items-center"><Camera size={15} /></button>
                </div>
                <div style={{ color: C.textSoft }} className="text-xs mb-3">
                  None of these are required, and you can use any combination — even just the plate alone, with no name at all, is a complete sale record.
                </div>
              </>
            ) : (
              <div style={{ background: "#FAEEDA", color: "#854F0B" }} className="rounded-lg px-3 py-2 text-xs mb-3">Billing to company — fill in company details at checkout.</div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs mb-2" style={{ borderCollapse: "collapse", minWidth: 280 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid " + C.border }}>
                    <th className="text-left py-1" style={{ color: C.textSoft }}>S/N</th>
                    <th className="text-left py-1" style={{ color: C.textSoft }}>Item</th>
                    <th className="text-right py-1" style={{ color: C.textSoft }}>Rate</th>
                    <th className="text-right py-1" style={{ color: C.textSoft }}>Amt</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {basket.length === 0 && <tr><td colSpan={5} className="py-3 text-center" style={{ color: C.textSoft }}>Basket is empty</td></tr>}
                  {basket.map((b, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid " + C.border }}>
                      <td className="py-1.5" style={{ color: C.ink }}>{i + 1}</td>
                      <td className="py-1.5" style={{ color: C.ink }}>
                        {b.name}
                        <div className="flex items-center gap-1 mt-1">
                          <button onClick={() => changeQty(i, -1)} style={{ border: "1px solid " + C.border }} className="w-5 h-5 rounded text-xs">-</button>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{b.qty}</span>
                          <button onClick={() => changeQty(i, 1)} style={{ border: "1px solid " + C.border }} className="w-5 h-5 rounded text-xs">+</button>
                        </div>
                      </td>
                      <td className="py-1.5 text-right" style={{ color: C.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>{b.rate.toLocaleString()}</td>
                      <td className="py-1.5 text-right" style={{ color: C.ink, fontFamily: "'IBM Plex Mono', monospace" }}>{(b.rate * b.qty).toLocaleString()}</td>
                      <td className="py-1.5 text-right"><button onClick={() => removeItem(i)} style={{ color: C.textSoft }}><X size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ borderTop: "1px solid " + C.border }} className="pt-2 flex items-center justify-between mb-3">
              <span style={{ color: C.ink }} className="text-sm font-bold">Total</span>
              <span style={{ color: C.ink, fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm font-bold">{money(total)}</span>
            </div>
            <label className="flex items-center gap-2 text-xs mb-3">
              <input type="checkbox" checked={companyMode} onChange={(e) => setCompanyMode(e.target.checked)} /> Bill to a company (generates an invoice)
            </label>
            <Button onClick={() => setPayOpen(true)} disabled={!basket.length} className="w-full">Checkout</Button>
          </div>
        </div>
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)}>
        <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Choose payment</div>
        {companyMode ? (
          <>
            <FieldLabel>Company name</FieldLabel>
            <input required value={companyForm.companyName} onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <FieldLabel>Company TIN</FieldLabel>
            <input value={companyForm.companyTIN} onChange={(e) => setCompanyForm({ ...companyForm, companyTIN: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <FieldLabel>Company address</FieldLabel>
            <input value={companyForm.companyAddress} onChange={(e) => setCompanyForm({ ...companyForm, companyAddress: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <Button onClick={() => finalizeSale("Invoice (Company)")} disabled={!companyForm.companyName.trim()} className="w-full">Generate invoice</Button>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            {["Cash", "Control Number", "Mobile Money"].map((m) => (
              <button key={m} onClick={() => finalizeSale(m)} style={{ border: "1.5px solid " + C.cyan, color: C.cyan }} className="text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-black/[0.02] active:scale-[0.97] transition">{m}</button>
            ))}
          </div>
        )}
        <button onClick={() => setPayOpen(false)} style={{ color: C.textSoft }} className="text-xs font-semibold mt-4 block mx-auto">Cancel</button>
      </Modal>

      {scannerOpen && <Suspense fallback={null}><BarcodeScannerModal onDetected={scanToAdd} onClose={() => setScannerOpen(false)} /></Suspense>}
    </div>
  );
}
