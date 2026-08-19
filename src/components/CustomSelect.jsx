import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085" };

// Drop-in replacement for <select> — same value/onChange shape, but renders as a real
// in-app dropdown instead of handing off to the phone's native OS picker, which can't
// be restyled by any web app and is what was covering the sidebar.
export default function CustomSelect({ value, onChange, options, placeholder = "Choose…", required, style, className, chevronColor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ borderColor: C.border, color: selected ? C.ink : C.textSoft, ...style }}
        className={className || "w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between"}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span style={{ color: chevronColor || C.textSoft }} className="ml-2 shrink-0">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>
      {required && !value && <input required value="" onChange={() => {}} className="sr-only" tabIndex={-1} />}
      {open && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(11,27,51,0.15)" }} className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-50 max-h-64 overflow-y-auto">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ background: o.value === value ? "#E6F1FB" : "transparent", color: C.ink }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-black/5"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
