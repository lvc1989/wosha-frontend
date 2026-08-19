import React, { useState, useRef, useEffect } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { C } from "../theme.js";

// A drop-in replacement for the native <input type="color"> circle — same
// small circular trigger, but opens a real saturation/hue picker with a live
// preview and a typed hex field, instead of the OS's plain three-slider
// dialog. Used everywhere a "customize this color" swatch already exists.
export default function ColorPickerButton({ value, onChange, label = "Custom", wide = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className={"relative " + (wide ? "block" : "inline-block")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={label}
        style={{ background: value || "#FFFFFF", border: `2px solid ${C.border}` }}
        className={wide ? "w-full h-10 rounded-lg cursor-pointer" : "w-8 h-8 rounded-full cursor-pointer"}
      />
      {open && (
        <div
          style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 12px 32px rgba(11,27,51,0.2)" }}
          className="absolute z-50 rounded-xl p-3 mt-2 right-0"
        >
          <HexColorPicker color={value || "#2B6CF6"} onChange={onChange} style={{ width: 200, height: 150 }} />
          <div className="flex items-center gap-2 mt-2">
            <span style={{ color: C.textSoft }} className="text-xs font-semibold">#</span>
            <HexColorInput
              color={value || "#2B6CF6"}
              onChange={onChange}
              style={{ borderColor: C.border, color: C.ink }}
              className="flex-1 border rounded-lg px-2 py-1 text-xs font-mono uppercase"
            />
          </div>
        </div>
      )}
    </div>
  );
}
