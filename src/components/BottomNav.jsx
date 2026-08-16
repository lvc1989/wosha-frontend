import { Link, useLocation } from "react-router-dom";
import { Home, ScanLine, Grid3x3, BarChart3, Settings as SettingsIcon } from "lucide-react";
import { C } from "../theme.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const TABS = [
  { to: "/", labelKey: "nav_home", icon: Home },
  { to: "/sales", labelKey: "nav_sales", icon: ScanLine },
  { to: "/menu", labelKey: "nav_menu", icon: Grid3x3 },
  { to: "/reports", labelKey: "nav_reports", icon: BarChart3 },
  { to: "/settings", labelKey: "nav_settings", icon: SettingsIcon },
];

export default function BottomNav({ userRole }) {
  const location = useLocation();
  const { t } = useLanguage();
  // Reports and Settings aren't available to every role — for a role that can't
  // see one of them, that tab quietly falls back to Menu instead of linking
  // somewhere that will just 403.
  const canSeeReports = ["owner", "manager"].includes(userRole);
  const canSeeSettings = userRole === "owner";

  return (
    <nav className="wosha-bottomnav" style={{ background: "#fff" }}>
      {TABS.map((t2) => {
        let to = t2.to;
        if (t2.to === "/reports" && !canSeeReports) to = "/menu";
        if (t2.to === "/settings" && !canSeeSettings) to = "/menu";
        const active = location.pathname === to || (t2.to === "/menu" && location.pathname === "/menu");
        return (
          <Link
            key={t2.labelKey}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
            style={{ color: active ? C.cyan : C.textSoft }}
          >
            <t2.icon size={21} strokeWidth={active ? 2.3 : 1.8} />
            <span className="text-[10px] font-medium">{t(t2.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
