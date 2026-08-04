import React from "react";

const C = { ink: "#0B1B33", textSoft: "#667085", border: "#E4E9F0", text: "#0F172A" };
const displayFont = "'Space Grotesk', 'Segoe UI', sans-serif";

export default function ComingSoon({ title }) {
  return (
    <div>
      <h1 style={{ color: C.ink, fontFamily: displayFont }} className="text-xl font-bold mb-4">{title}</h1>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6">
        <div style={{ color: C.text }} className="text-sm mb-2">This page existed in the prototype but hasn't been rebuilt on the real backend yet.</div>
        <div style={{ color: C.textSoft }} className="text-xs">This isn't a bug — it's an honest placeholder rather than a broken link. Ask for this module by name and it'll be built next.</div>
      </div>
    </div>
  );
}
