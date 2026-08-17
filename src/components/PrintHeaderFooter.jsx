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

  if (s.print_header_attachment_type === "image" && s.print_header_attachment_url) {
    return (
      <div className={`wosha-print-header flex ${s.print_header_align === "center" ? "justify-center" : s.print_header_align === "right" ? "justify-end" : "justify-start"}`} style={{ minHeight: "1.1cm", maxHeight: "1.3cm", borderBottom: `1px solid ${C.border}`, paddingBottom: "0.15cm", marginBottom: "0.3cm" }}>
        <img src={s.print_header_attachment_url} alt="" style={{ maxHeight: "1.1cm", width: "auto", maxWidth: "100%" }} className="object-contain" />
      </div>
    );
  }
  if (s.print_header_attachment_type === "docx" && s.print_header_attachment_html) {
    return (
      <div
        className={`wosha-print-header ${alignClass[s.print_header_align || "left"]}`}
        style={{ minHeight: "1.1cm", maxHeight: "1.3cm", overflow: "hidden", borderBottom: `1px solid ${C.border}`, paddingBottom: "0.15cm", marginBottom: "0.3cm", fontSize: "8pt", lineHeight: 1.2, color: C.ink }}
        dangerouslySetInnerHTML={{ __html: s.print_header_attachment_html }}
      />
    );
  }

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
  if (!s || s.print_footer_enabled === false) return null;

  if (s.print_footer_attachment_type === "image" && s.print_footer_attachment_url) {
    return (
      <div className={`wosha-print-footer flex ${s.print_footer_align === "center" ? "justify-center" : s.print_footer_align === "right" ? "justify-end" : "justify-start"}`} style={{ minHeight: "1.1cm", maxHeight: "1.3cm", borderTop: `1px solid ${C.border}`, paddingTop: "0.15cm", marginTop: "0.3cm" }}>
        <img src={s.print_footer_attachment_url} alt="" style={{ maxHeight: "1.1cm", width: "auto", maxWidth: "100%" }} className="object-contain" />
      </div>
    );
  }
  if (s.print_footer_attachment_type === "docx" && s.print_footer_attachment_html) {
    return (
      <div
        className={`wosha-print-footer ${alignClass[s.print_footer_align || "center"]}`}
        style={{ minHeight: "1.1cm", maxHeight: "1.3cm", overflow: "hidden", borderTop: `1px solid ${C.border}`, paddingTop: "0.15cm", marginTop: "0.3cm", fontSize: "8pt", lineHeight: 1.2, color: C.textSoft }}
        dangerouslySetInnerHTML={{ __html: s.print_footer_attachment_html }}
      />
    );
  }

  if (!s.print_footer_text) return null;
  return (
    <div
      className={`wosha-print-footer ${alignClass[s.print_footer_align || "center"]}`}
      style={{ minHeight: "1.1cm", borderTop: `1px solid ${C.border}`, paddingTop: "0.15cm", marginTop: "0.3cm", color: C.textSoft, fontSize: "8pt", whiteSpace: "pre-line" }}
    >
      {s.print_footer_text}
    </div>
  );
}
