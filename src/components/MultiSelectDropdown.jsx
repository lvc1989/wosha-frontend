import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085" };

// value: array of selected string values. onChange(newArray).
export default function MultiSelectDropdown({ value = [], onChange, options, placeholder = "None selected", emptyMessage = "No options yet." }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (v) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const summary = value.length === 0 ? placeholder : value.length <= 2 ? value.join(", ") : `${value.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ borderColor: C.border, color: value.length ? C.ink : C.textSoft }}
        className="w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between gap-2"
      >
        <span className="truncate">{summary}</span>
        <span style={{ color: C.textSoft }} className="shrink-0">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>
      {open && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(11,27,51,0.15)" }} className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-50 max-h-56 overflow-y-auto">
          {options.length === 0 && <div style={{ color: C.textSoft }} className="px-3 py-3 text-xs">{emptyMessage}</div>}
          {options.map((o) => {
            const selected = value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                style={{ background: selected ? "#E6F1FB" : "transparent", color: C.ink }}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-black/5 flex items-center justify-between gap-2"
              >
                {o.label}
                {selected && <Check size={15} style={{ color: C.cyan }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
