import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", bg: "#F5F7FA", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626" };
const money = (n) => "TZS " + Number(n).toLocaleString();

export default function PaymentInfoPage() {
  const { code } = useParams();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPublicPaymentCode(code).then(setInfo).catch((err) => setError(err.message));
  }, [code]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }} className="flex items-center justify-center p-4">
      <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-2xl p-8 text-center">
        {error ? (
          <>
            <div style={{ color: C.danger }} className="text-sm font-semibold mb-2">This payment code isn't available</div>
            <div style={{ color: C.textSoft }} className="text-xs">{error}</div>
          </>
        ) : !info ? (
          <div style={{ color: C.textSoft }} className="text-sm">Loading…</div>
        ) : (
          <>
            {info.logoUrl && <img src={info.logoUrl} alt="" style={{ height: 48 }} className="mx-auto mb-3 object-contain" />}
            <div style={{ color: C.ink }} className="text-lg font-bold mb-1">{info.businessName}</div>
            <div style={{ color: C.ink }} className="text-sm font-medium mb-4">{info.label}</div>
            {info.amount != null && (
              <div style={{ background: C.bg }} className="rounded-xl py-4 mb-4">
                <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase tracking-wide mb-1">Amount</div>
                <div style={{ color: C.ink }} className="text-2xl font-bold">{money(info.amount)}</div>
              </div>
            )}
            <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-2">How to pay</div>
            <div style={{ color: C.ink }} className="text-sm whitespace-pre-line mb-2">
              {info.paymentInstructions || "Ask a staff member for payment instructions."}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
