import { Link } from "react-router-dom";
import { NAV, useUser } from "../App.jsx";
import { PageHeader, TONES } from "../components/ui.jsx";
import { C } from "../theme.js";

// A colorful icon-tile grid covering every real destination in the app — the
// alternative to the sidebar list, for anyone who prefers to browse by grid.
// Reuses the exact same NAV array the sidebar itself is built from, so there's
// only ever one real source of truth for "what pages exist" — this can never
// drift out of sync with the sidebar version.
const ACCENT_CYCLE = ["cyan", "amber", "success", "ink"];

export default function MenuGrid() {
  const { user } = useUser();
  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div>
      <PageHeader title="Menu" subtitle="Everything in one place" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item, i) => {
          const tone = TONES[ACCENT_CYCLE[i % ACCENT_CYCLE.length]];
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center text-center gap-2 bg-white rounded-2xl py-6 px-3 hover:-translate-y-0.5 transition-transform"
            >
              <div style={{ background: tone.tint }} className="w-12 h-12 rounded-2xl flex items-center justify-center">
                <item.icon size={22} color={tone.deep} strokeWidth={1.8} />
              </div>
              <span style={{ color: C.ink }} className="text-xs font-semibold leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
