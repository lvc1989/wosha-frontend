import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085" };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

const pad = (n) => String(n).padStart(2, "0");
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Drop-in replacement for <input type="date"> — value/onChange use the same
// "YYYY-MM-DD" string format, but renders as a real in-app dropdown calendar
// instead of the phone's native full-screen date picker.
export default function CustomDatePicker({ value, onChange, placeholder = "Choose a date…", style, className }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value + "T00:00:00") : new Date());
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const selectDay = (day) => {
    const d = new Date(year, month, day);
    onChange(toStr(d));
    setOpen(false);
  };

  const display = value ? new Date(value + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ borderColor: C.border, color: value ? C.ink : C.textSoft, ...style }}
        className={className || "w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between gap-2"}
      >
        <span>{display || placeholder}</span>
        <Calendar size={14} style={{ color: C.textSoft, flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(11,27,51,0.15)", width: 260 }} className="absolute left-0 top-full mt-1 rounded-lg p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ color: C.textSoft }}><ChevronLeft size={16} /></button>
            <span style={{ color: C.ink }} className="text-sm font-semibold">{MONTHS[month]} {year}</span>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ color: C.textSoft }}><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d, i) => <div key={i} style={{ color: C.textSoft }} className="text-[10px] font-semibold text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const isSelected = value === toStr(new Date(year, month, day));
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(day)}
                  style={{ background: isSelected ? C.cyan : "transparent", color: isSelected ? "#fff" : C.ink }}
                  className="text-xs rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/5"
                >
                  {day}
                </button>
              );
            })}
          </div>
          {value && (
            <button type="button" onClick={() => { onChange(""); setOpen(false); }} style={{ color: C.textSoft }} className="text-xs font-semibold mt-2 block mx-auto">Clear</button>
          )}
        </div>
      )}
    </div>
  );
}
