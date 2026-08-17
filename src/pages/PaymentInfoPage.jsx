import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { C } from "../App.jsx";

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
      <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-2xl overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <div style={{ color: C.danger }} className="text-sm font-semibold mb-2">This payment code isn't available</div>
            <div style={{ color: C.textSoft }} className="text-xs">{error}</div>
          </div>
        ) : !info ? (
          <div style={{ color: C.textSoft }} className="text-sm p-8 text-center">Loading…</div>
        ) : (
          <>
            <div style={{ background: C.ink }} className="relative overflow-hidden px-8 pt-8 pb-6 text-center">
              <div style={{ background: "rgba(43,108,246,0.18)" }} className="absolute -right-3 -top-8 w-28 h-28 rounded-full" />
              <div className="relative">
                {info.logoUrl && <img src={info.logoUrl} alt="" style={{ height: 44 }} className="mx-auto mb-3 object-contain" />}
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#fff" }} className="text-lg font-bold mb-1">{info.businessName}</div>
                <div style={{ color: "rgba(255,255,255,0.75)" }} className="text-sm font-medium">{info.label}</div>
              </div>
            </div>
            <div className="p-8 text-center">
              {info.amount != null && (
                <div style={{ background: "#E6F1FB" }} className="rounded-xl py-4 mb-4">
                  <div style={{ color: "#185FA5" }} className="text-xs font-semibold uppercase tracking-wide mb-1">Amount</div>
                  <div style={{ color: "#185FA5", fontFamily: "'IBM Plex Mono', monospace" }} className="text-2xl font-medium">{money(info.amount)}</div>
                </div>
              )}
              <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mb-2">How to pay</div>
              <div style={{ color: C.ink }} className="text-sm whitespace-pre-line mb-2">
                {info.paymentInstructions || "Ask a staff member for payment instructions."}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
