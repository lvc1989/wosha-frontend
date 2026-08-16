import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { NAV, useUser } from "../App.jsx";
import { PageHeader, TONES } from "../components/ui.jsx";
import { C, ICON_SIZE_PRESETS, getIconSizePref } from "../theme.js";

// A colorful icon-tile grid covering every real destination in the app — the
// alternative to the sidebar list, for anyone who prefers to browse by grid.
// Reuses the exact same NAV array the sidebar itself is built from, so there's
// only ever one real source of truth for "what pages exist" — this can never
// drift out of sync with the sidebar version. Every tile uses the same tone
// (the customizable primary color) rather than cycling through several —
// one consistent color reads as organized; a different color per tile reads
// as random, not as variety. Size/columns read from the same shared preference
// the Dashboard's quick actions use, so the two stay visually consistent.
export default function MenuGrid() {
  const { user } = useUser();
  const items = NAV.filter((n) => n.roles.includes(user.role));
  const tone = TONES.cyan;
  const [pref, setPref] = useState(getIconSizePref);
  useEffect(() => {
    const handler = () => setPref(getIconSizePref());
    window.addEventListener("wosha-icon-size-change", handler);
    return () => window.removeEventListener("wosha-icon-size-change", handler);
  }, []);
  const preset = ICON_SIZE_PRESETS[pref.size];

  return (
    <div>
      <PageHeader title="Menu" subtitle="Everything in one place" />
      <div className={"grid gap-3 " + (pref.cols === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center text-center gap-2 bg-white rounded-2xl py-6 px-3 hover:-translate-y-0.5 transition-transform"
          >
            <div style={{ background: tone.tint }} className={`${preset.box} ${preset.radius} flex items-center justify-center`}>
              <item.icon size={preset.icon + 3} color={tone.deep} strokeWidth={1.8} />
            </div>
            <span style={{ color: C.ink }} className="text-xs font-semibold leading-tight">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
