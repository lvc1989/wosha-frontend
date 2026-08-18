import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { NAV, useUser, useBrand } from "../App.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { PageHeader } from "../components/ui.jsx";
import { C, ICON_SIZE_PRESETS, getIconSizePref } from "../theme.js";
import { useScreenSize } from "../hooks/useScreenSize.js";

// A colorful icon-tile grid covering every real destination in the app — the
// alternative to the sidebar list, for anyone who prefers to browse by grid.
// Reuses the exact same NAV array the sidebar itself is built from, so there's
// only ever one real source of truth for "what pages exist" — this can never
// drift out of sync with the sidebar version. Tile background and icon color
// are both customizable in Settings, separate from the general app theme, so
// this grid can have its own distinct look if wanted.
export default function MenuGrid() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { brand } = useBrand();
  const items = NAV.filter((n) => n.roles.includes(user.role));
  const tileBg = brand?.menu_icon_bg_color || "#E6F1FB";
  const iconColor = brand?.menu_icon_color || "#185FA5";
  const [pref, setPref] = useState(getIconSizePref);
  useEffect(() => {
    const handler = () => setPref(getIconSizePref());
    window.addEventListener("wosha-icon-size-change", handler);
    return () => window.removeEventListener("wosha-icon-size-change", handler);
  }, []);
  const preset = ICON_SIZE_PRESETS[pref.size];
  const { width } = useScreenSize();
  // The user's actual preference now genuinely applies on every screen size —
  // previously this used static Tailwind breakpoint classes (grid-cols-2
  // sm:grid-cols-3), which silently forced 2 columns on any screen under
  // 640px regardless of what was selected, since almost every phone falls
  // under that breakpoint. Only two real, narrow safety overrides remain: a
  // genuinely tiny screen still gets forced to 2, and a genuinely wide
  // screen gets a bonus 4th column even at the "3" preference.
  const cols = width < 360 ? 2 : (pref.cols === 3 && width >= 900) ? 4 : pref.cols;
  const colClass = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[cols];

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
            <div style={{ background: tileBg }} className={`${preset.box} ${preset.radius} flex items-center justify-center`}>
              <item.icon size={preset.icon + 3} color={iconColor} strokeWidth={1.8} />
            </div>
            <span style={{ color: C.ink }} className="text-xs font-semibold leading-tight">{t(item.labelKey)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
