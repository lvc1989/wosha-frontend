import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { NAV, useUser } from "../App.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { PageHeader, TONES } from "../components/ui.jsx";
import { C, ICON_SIZE_PRESETS, getIconSizePref } from "../theme.js";
import { useScreenSize } from "../hooks/useScreenSize.js";

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
  const { t } = useLanguage();
  const items = NAV.filter((n) => n.roles.includes(user.role));
  const tone = TONES.cyan;
  const [pref, setPref] = useState(getIconSizePref);
  useEffect(() => {
    const handler = () => setPref(getIconSizePref());
    window.addEventListener("wosha-icon-size-change", handler);
    return () => window.removeEventListener("wosha-icon-size-change", handler);
  }, []);
  const preset = ICON_SIZE_PRESETS[pref.size];
  const { width } = useScreenSize();
  // Same automatic narrow-screen override as the Dashboard's quick actions,
  // plus a genuine extra tier: on a real tablet/desktop-width screen, there's
  // room for 4 columns even at the "3 columns" preference, so it's not
  // artificially capped just because a phone-sized default was chosen once.
  const cols = width < 360 ? 2 : (pref.cols === 3 && width >= 900) ? 4 : pref.cols;
  const colClass = { 2: "grid-cols-2", 3: "grid-cols-2 sm:grid-cols-3", 4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" }[cols];

  return (
    <div>
      <PageHeader title="Menu" subtitle="Everything in one place" />
      <div className={"grid gap-3 " + colClass}>
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center text-center gap-2 bg-white rounded-2xl py-6 px-3 hover:-translate-y-0.5 transition-transform"
          >
            <div style={{ background: tone.tint }} className={`${preset.box} ${preset.radius} flex items-center justify-center`}>
              <item.icon size={preset.icon + 3} color={tone.deep} strokeWidth={1.8} />
            </div>
            <span style={{ color: C.ink }} className="text-xs font-semibold leading-tight">{t(item.labelKey)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
