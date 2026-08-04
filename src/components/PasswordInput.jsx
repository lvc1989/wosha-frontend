import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const C = { border: "#E4E7EC", textSoft: "#667085" };

// Drop-in replacement for <input type="password">. Accepts the same props (value,
// onChange, placeholder, required, etc.) plus className/style, which apply to the
// outer wrapper (so margin/width utilities like "mb-3" behave exactly as they would
// on a plain input) — the field itself always uses the app's standard input styling.
export default function PasswordInput({ className, style, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className || "w-full mb-3"}`} style={style}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        style={{ borderColor: C.border, paddingRight: 38 }}
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        style={{ color: C.textSoft }}
        className="absolute right-2.5 top-1/2 -translate-y-1/2"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
