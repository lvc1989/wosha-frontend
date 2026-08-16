import { Link, useLocation } from "react-router-dom";
import { Home, ScanLine, Grid3x3, BarChart3, Settings as SettingsIcon } from "lucide-react";
import { C } from "../theme.js";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/sales", label: "Sales", icon: ScanLine },
  { to: "/menu", label: "Menu", icon: Grid3x3 },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function BottomNav({ userRole }) {
  const location = useLocation();
  // Reports and Settings aren't available to every role — for a role that can't
  // see one of them, that tab quietly falls back to Menu instead of linking
  // somewhere that will just 403.
  const canSeeReports = ["owner", "manager"].includes(userRole);
  const canSeeSettings = userRole === "owner";

  return (
    <nav className="wosha-bottomnav" style={{ background: "#fff" }}>
      {TABS.map((t) => {
        let to = t.to;
        if (t.to === "/reports" && !canSeeReports) to = "/menu";
        if (t.to === "/settings" && !canSeeSettings) to = "/menu";
        const active = location.pathname === to || (t.to === "/menu" && location.pathname === "/menu");
        return (
          <Link
            key={t.label}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
            style={{ color: active ? C.cyan : C.textSoft }}
          >
            <t.icon size={21} strokeWidth={active ? 2.3 : 1.8} />
            <span className="text-[10px] font-medium">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
