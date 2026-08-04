import React, { useState, useEffect } from "react";
import { api } from "../api.js";

const C = { ink: "#0B1B33", textSoft: "#667085", border: "#E4E7EC" };
const alignClass = { left: "text-left items-start", center: "text-center items-center", right: "text-right items-end" };

// Sized in real print units (not vh/%, which print stylesheets don't reliably support) —
// ~1.1cm on an A4/Letter page comes out to roughly 3-4% of the page height, matching the
// requested 3-5% per section without needing JS to measure the actual paper size.
export function PrintHeader() {
  const [s, setS] = useState(null);
  useEffect(() => { api.getSettings().then(setS).catch(() => {}); }, []);
  if (!s || s.print_header_enabled === false) return null;

  return (
    <div
      className={`wosha-print-header flex flex-col justify-center gap-1 ${alignClass[s.print_header_align || "left"]}`}
      style={{ minHeight: "1.1cm", borderBottom: `1px solid ${C.border}`, paddingBottom: "0.15cm", marginBottom: "0.3cm" }}
    >
      <div className={`flex gap-2 ${s.print_header_align === "center" ? "justify-center" : s.print_header_align === "right" ? "justify-end" : "justify-start"} items-center`}>
        {s.print_header_show_logo !== false && s.logo_url && (
          <img src={s.logo_url} alt="" style={{ height: "0.7cm", width: "0.7cm" }} className="object-contain rounded" />
        )}
        <span style={{ color: C.ink, fontSize: "13pt" }} className="font-bold">{s.business_name || "Wosha"}</span>
      </div>
      {s.print_header_show_slogan !== false && s.tagline && (
        <div style={{ color: C.textSoft, fontSize: "8pt" }}>{s.tagline}</div>
      )}
    </div>
  );
}

export function PrintFooter() {
  const [s, setS] = useState(null);
  useEffect(() => { api.getSettings().then(setS).catch(() => {}); }, []);
  if (!s || s.print_footer_enabled === false || !s.print_footer_text) return null;

  return (
    <div
      className={`wosha-print-footer ${alignClass[s.print_footer_align || "center"]}`}
      style={{ minHeight: "1.1cm", borderTop: `1px solid ${C.border}`, paddingTop: "0.15cm", marginTop: "0.3cm", color: C.textSoft, fontSize: "8pt", whiteSpace: "pre-line" }}
    >
      {s.print_footer_text}
    </div>
  );
}
