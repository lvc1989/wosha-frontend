import React, { useState, useEffect } from "react";
import { api } from "../api.js";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626", dangerBg: "#FEE2E2" };
const money = (n) => "TZS " + Number(n || 0).toLocaleString();

export default function Invoicing() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.getInvoices().then(setInvoices).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const pay = async (id) => { await api.payInvoice(id, "Cash"); load(); };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <h1 style={{ color: C.ink }} className="text-xl font-bold mb-6">Invoicing</h1>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {invoices.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No invoices yet.</div>}
        {invoices.map((inv, i) => (
          <div key={inv.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{money(inv.total)}</div>
              <div style={{ color: C.textSoft }} className="text-xs">Control #{inv.control_number} · {inv.items?.length || 0} item(s)</div>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ background: inv.status === "Paid" ? "#E6F4EA" : C.dangerBg, color: inv.status === "Paid" ? "#166534" : C.danger }} className="text-xs font-medium px-2.5 py-1 rounded-full">{inv.status}</span>
              {inv.status !== "Paid" && <button onClick={() => pay(inv.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>Mark Paid</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
