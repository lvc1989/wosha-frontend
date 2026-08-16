import React, { useState, useEffect, useRef, createContext, useContext, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { api, setToken, MISCONFIGURED_API_URL, API_BASE_URL_FOR_DISPLAY } from "./api.js";
import { applyTheme } from "./components/ui.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Login from "./pages/Login.jsx";
import AccountMenu from "./AccountMenu.jsx";
import CustomSelect from "./components/CustomSelect.jsx";

// Lazy-loaded: each page's code (and anything heavy it pulls in, like Reports' charting
// library) only downloads when that page is actually visited, instead of every page's
// code being bundled into one huge file loaded up front on every visit.
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const MenuGrid = lazy(() => import("./pages/MenuGrid.jsx"));
const PaymentInfoPage = lazy(() => import("./pages/PaymentInfoPage.jsx"));
const Customers = lazy(() => import("./pages/Customers.jsx"));
const Bookings = lazy(() => import("./pages/Bookings.jsx"));
const Finance = lazy(() => import("./pages/Finance.jsx"));
const Services = lazy(() => import("./pages/Services.jsx"));
const Staff = lazy(() => import("./pages/Staff.jsx"));
const Inventory = lazy(() => import("./pages/Inventory.jsx"));
const Marketing = lazy(() => import("./pages/Marketing.jsx"));
const Compliance = lazy(() => import("./pages/Compliance.jsx"));
const Sales = lazy(() => import("./pages/Sales.jsx"));
const Messages = lazy(() => import("./pages/Messages.jsx"));
const Reports = lazy(() => import("./pages/Reports.jsx"));
const SettingsPage = lazy(() => import("./pages/Settings.jsx"));
const ComingSoon = lazy(() => import("./pages/ComingSoon.jsx"));

// Exact tokens from the prototype — cyan/amber/violet are legacy internal names,
// their hex values carry Wosha's real blue/yellow/near-black palette. Defined in
// theme.js (a standalone module with no dependencies) — imported here for this
// file's own use (the Shell, LoadingScreen, and nav below all use C directly)
// AND re-exported so every page's existing `import { C } from "../App.jsx"`
// keeps working unchanged. A bare re-export alone would not have been enough —
// it makes a binding available to other files, but does not itself create a
// usable local variable in this file, which is exactly the mistake that caused
// "C is not defined" here after the very last fix.
import { C, displayFont, bodyFont, monoFont, isLightColor } from "./theme.js";
export { C, displayFont, bodyFont, monoFont };

export const BranchContext = createContext({ loc: "all", setLoc: () => {}, locations: [] });
export const useBranch = () => useContext(BranchContext);

export const UserContext = createContext({ user: null });
export const useUser = () => useContext(UserContext);

export const BrandContext = createContext({ brand: null, refreshBrand: () => {} });
export const useBrand = () => useContext(BrandContext);

// Same order, labels, and role visibility as the final prototype. Pages not yet built
// in this real version route to an honest "coming soon" placeholder instead of a dead link.
import {
  Home, Calendar, Users, Droplets, Receipt, CreditCard, Package,
  Megaphone,
  UserCog, MessageCircle, ShieldCheck, BarChart3, Settings as SettingsIcon,
  Bell, ChevronDown, ChevronUp,
} from "lucide-react";

export const NAV = [
  { to: "/", label: "Dashboard", icon: Home, roles: ["owner", "manager", "staff"] },
  { to: "/customers", label: "Customers", icon: Users, roles: ["owner", "manager", "staff"] },
  { to: "/services", label: "Services & Products", icon: Droplets, roles: ["owner", "manager", "staff"] },
  { to: "/sales", label: "Record Sale", icon: Receipt, roles: ["owner", "manager", "staff"] },
  { to: "/finance", label: "Finance", icon: CreditCard, roles: ["owner", "manager", "staff"] },
  { to: "/inventory", label: "Inventory & Supply", icon: Package, roles: ["owner", "manager", "staff"] },
  { to: "/marketing", label: "Marketing", icon: Megaphone, roles: ["owner", "manager"] },
  { to: "/staff", label: "Staff", icon: UserCog, roles: ["owner", "manager"] },
  { to: "/messages", label: "Messages", icon: MessageCircle, roles: ["owner", "manager", "staff"] },
  { to: "/compliance", label: "Compliance & Tasks", icon: ShieldCheck, roles: ["owner", "manager", "staff"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["owner", "manager"] },
  { to: "/bookings", label: "Bookings", icon: Calendar, roles: ["owner", "manager", "staff"] },
  { to: "/settings", label: "Settings", icon: SettingsIcon, roles: ["owner"] },
];

// The full-screen branded boot/loading state — blue background (customizable in
// Settings) with the business's own logo centered, falling back to a plain mark
// if none is set. Defined here rather than imported from ui.jsx deliberately:
// ui.jsx already imports C/displayFont from this file, so importing back from
// ui.jsx here would create a circular dependency between the two modules.
function LoadingScreen({ backgroundColor, logoUrl, businessName, status, onRetry }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: backgroundColor || "#2B6CF6" }}>
      {logoUrl ? (
        <img src={logoUrl} alt="" className="w-28 h-28 rounded-3xl object-contain mb-5" style={{ background: "#fff" }} />
      ) : (
        <div style={{ background: "#0B1B33", color: "#FFC93C" }} className="w-28 h-28 rounded-3xl flex items-center justify-center font-bold text-5xl mb-5">
          {(businessName || "Wosha").charAt(0).toUpperCase()}
        </div>
      )}
      {businessName && <div style={{ color: "#fff" }} className="font-bold text-lg mb-1" >{businessName}</div>}
      {!onRetry && <div className="w-6 h-6 rounded-full border-[3px] mt-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.35)", borderTopColor: "#fff" }} />}
      {status && <div style={{ color: "rgba(255,255,255,0.85)" }} className="text-sm mt-5 max-w-xs text-center px-6">{status}</div>}
      {onRetry && (
        <button onClick={onRetry} style={{ background: "#fff", color: "#0B1B33" }} className="mt-5 text-sm font-semibold px-5 py-2 rounded-lg">
          Try again
        </button>
      )}
    </div>
  );
}

function playNotificationBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const beep = (startTime) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(startTime); osc.stop(startTime + 0.2);
    };
    const now = ctx.currentTime;
    beep(now);
    beep(now + 0.28);
  } catch {}
}

function Shell({ user, onLogout, onUserUpdate, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { loc, setLoc, locations } = useBranch();
  const [reminders, setReminders] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [brand, setBrand] = useState(null);
  // A per-device preference, not a business-wide setting — different staff on
  // different phones might genuinely prefer different layouts, and this way
  // switching is instant with no server round-trip. Defaults to the sidebar,
  // so nobody's existing experience changes unless they deliberately opt in.
  const [layoutStyle, setLayoutStyle] = useState(() => localStorage.getItem("wosha_layout") === "grid" ? "grid" : "sidebar");
  useEffect(() => {
    const handler = () => setLayoutStyle(localStorage.getItem("wosha_layout") === "grid" ? "grid" : "sidebar");
    // "storage" only fires in OTHER tabs by browser design — this custom event,
    // dispatched by Settings.jsx right after saving, is what makes the switch
    // apply instantly in the same tab someone is actually looking at.
    window.addEventListener("storage", handler);
    window.addEventListener("wosha-layout-change", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("wosha-layout-change", handler);
    };
  }, []);
  const nav = NAV.filter((n) => n.roles.includes(user.role));
  const topbarIsLight = isLightColor(brand?.theme_topbar_color || "#FFFFFF");
  const bellRef = useRef(null);
  const prevReminderCount = useRef(0);

  useEffect(() => {
    const load = () => api.getReminders().then((r) => {
      if (r.length > prevReminderCount.current) playNotificationBeep();
      prevReminderCount.current = r.length;
      setReminders(r);
    }).catch(() => {});
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  // Closes the moment anything else is clicked — checked against every click in the document.
  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const goToReminder = (r) => {
    setBellOpen(false);
    if (r.kind === "Task") navigate("/compliance");
    else if (r.kind === "Compliance") navigate("/compliance");
    else if (r.kind === "Stock") navigate("/inventory");
    else if (r.kind === "Expense") navigate("/finance?tab=expenses");
    else if (r.kind === "Purchase Order") navigate("/inventory?tab=orders");
    else if (r.kind === "New Customer") navigate(`/customers?edit=${r.customerId}`);
    else navigate("/");
  };

  const refreshBrand = () => api.getSettings().then((s) => {
    setBrand(s);
    if (s?.theme_primary_color || s?.theme_accent_color) applyTheme(s.theme_primary_color, s.theme_accent_color);
  }).catch(() => {});
  useEffect(() => { refreshBrand(); }, []);

  const logoPx = { sm: 24, md: 32, lg: 40 }[brand?.logo_size || "md"];

  return (
    <div className={"wosha-app-shell" + (layoutStyle === "grid" ? " wosha-layout-grid" : "")} style={{ background: C.bg, fontFamily: bodyFont, color: C.text }}>
      <div className="wosha-fixed-topstrip">
        <button onClick={() => navigate("/")} style={{ background: brand?.sidebar_color || C.ink }} className="wosha-logo-strip flex items-center gap-2 px-4 shrink-0 text-left">
          {brand?.logo_url ? (
            <img src={brand.logo_url} alt="" className="rounded-lg object-cover shrink-0" style={{ width: logoPx, height: logoPx }} />
          ) : (
            <div style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.amber})`, width: logoPx, height: logoPx }} className="rounded-lg shrink-0" />
          )}
          <div className="wosha-navlabel">
            <span style={{ fontFamily: displayFont, color: "#fff" }} className="text-lg font-bold block leading-tight">{brand?.business_name || "Wosha"}</span>
            {brand?.tagline && <span style={{ color: "rgba(255,255,255,0.5)" }} className="text-[10px] block leading-tight">{brand.tagline}</span>}
          </div>
        </button>
        <div style={{ background: brand?.theme_topbar_color || "#fff" }} className="flex-1 flex items-center justify-end gap-2 sm:gap-3 px-3 sm:px-6">
          {locations.length > 0 && (
            <div style={{ width: 132 }}>
              <CustomSelect value={loc} onChange={setLoc} options={[{ value: "all", label: "All Branches" }, ...locations.map((l) => ({ value: l.id, label: l.name }))]} className="w-full border rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-left flex items-center justify-between" style={{ borderColor: C.border, fontFamily: bodyFont }} />
            </div>
          )}
          <button onClick={() => navigate("/bookings")} title="Bookings" style={{ color: topbarIsLight ? C.textSoft : "#fff" }}>
            <Calendar size={20} strokeWidth={1.75} />
          </button>
          <div ref={bellRef} className="relative">
            <button onClick={() => setBellOpen((v) => !v)} className="relative" style={{ color: topbarIsLight ? C.textSoft : "#fff" }}>
              <Bell size={21} strokeWidth={1.75} />
              {reminders.length > 0 && <span style={{ background: C.danger }} className="absolute -top-1.5 -right-1.5 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{reminders.length}</span>}
            </button>
            {bellOpen && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(11,27,51,0.15)" }} className="wosha-bell-dropdown rounded-xl overflow-hidden max-h-96 overflow-y-auto z-50">
                {reminders.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>Nothing needs your attention right now.</div>}
                {reminders.map((r) => (
                  <button key={r.id} onClick={() => goToReminder(r)} className="w-full text-left px-4 py-3 hover:bg-black/5" style={{ borderTop: `1px solid ${C.border}` }}>
                    <div style={{ color: r.urgent ? C.danger : C.text }} className="text-sm font-medium">{r.label}</div>
                    <div style={{ color: C.textSoft }} className="text-xs">{r.kind} — tap to open</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <AccountMenu user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} />
        </div>
      </div>

      <aside style={{ background: brand?.sidebar_color || C.ink }} className="wosha-fixed-sidebar flex flex-col py-4 px-2">
        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} title={n.label}
              style={{ background: location.pathname === n.to ? "rgba(255,255,255,0.1)" : "transparent", color: location.pathname === n.to ? "#fff" : "rgba(255,255,255,0.65)" }}
              className="wosha-navlink px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <n.icon className="wosha-navicon" size={19} strokeWidth={1.75} />
              <span className="wosha-navlabel">{n.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="wosha-fixed-main p-8"><BrandContext.Provider value={{ brand, refreshBrand, layoutStyle }}>{children}</BrandContext.Provider></div>
      {layoutStyle === "grid" && <BottomNav userRole={user.role} />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootStatus, setBootStatus] = useState("");
  const [bootError, setBootError] = useState(false);
  const [publicBrand, setPublicBrand] = useState(null);
  const [themeVersion, setThemeVersion] = useState(0);
  const [loc, setLoc] = useState("all");
  const [locations, setLocations] = useState([]);

  // The branded screen needs real colors/logo before we even know who's logged
  // in, so this loads independently and doesn't block the auth check — if it's
  // slow or fails, the screen just falls back to the default blue mark.
  useEffect(() => {
    api.getPublicSettings().then((brand) => {
      setPublicBrand(brand);
      // Mutates the shared C/TONES objects every other page already reads from —
      // bumping themeVersion forces one re-render so the new colors reach the
      // whole app immediately, without needing to touch 23+ individual pages.
      if (brand?.theme_primary_color || brand?.theme_accent_color) {
        applyTheme(brand.theme_primary_color, brand.theme_accent_color);
        setThemeVersion((v) => v + 1);
      }
    }).catch(() => {});
  }, []);

  const checkAuth = () => {
    // The single most common real cause of "the app never opens" after a fresh
    // deploy: the backend address was never configured for this deployment, so
    // every request is silently trying to reach a server on the phone itself,
    // which can never work no matter how long anyone waits. Checked and shown
    // immediately — there is nothing to wait for here.
    if (MISCONFIGURED_API_URL) {
      setBootError(true);
      setBootStatus("This deployment isn't configured correctly — it's trying to reach a local address instead of the real backend. In Vercel, open this project → Settings → Environment Variables → add VITE_API_URL set to your real backend's address ending in /api, then redeploy.");
      setLoading(false);
      return;
    }
    setBootError(false);
    setLoading(true);
    // A slow-to-wake hosted backend (Render's free tier can take 30-60s from a
    // cold start) used to leave this on a plain "Loading…" forever with zero
    // explanation — this is what "the app just won't open" often was.
    const slowTimer = setTimeout(() => setBootStatus("Just a few more moments — getting everything ready for you…"), 5000);
    // A second, completely independent safety net: no matter what happens inside
    // api.meWithRetry() — even a bug neither of us has found yet — this guarantees
    // the loading screen can never be stuck for more than a short, bounded time.
    // Kept short deliberately: a long wait before any feedback at all is its own
    // problem, even when the underlying logic is technically still working.
    let settled = false;
    const hardFailsafe = setTimeout(() => {
      if (settled) return;
      settled = true;
      setBootError(true);
      setBootStatus(`Couldn't connect after waiting. Trying to reach: ${API_BASE_URL_FOR_DISPLAY}. Check your connection, confirm the backend is running, and try again.`);
      setLoading(false);
    }, 20000);
    api.meWithRetry()
      .then((u) => { if (settled) return; settled = true; setUser(u); setBootStatus(""); setLoading(false); })
      .catch((err) => {
        if (settled) return; settled = true;
        if (err.message === "TIMEOUT") { setBootError(true); setBootStatus(`Couldn't reach the server at ${API_BASE_URL_FOR_DISPLAY}. Check your connection and try again.`); }
        else setToken(null);
        setLoading(false);
      })
      .finally(() => { clearTimeout(slowTimer); clearTimeout(hardFailsafe); });
  };

  useEffect(() => { checkAuth(); }, []);

  // Once logged in, quietly download the code for the pages this specific person
  // can actually navigate to (matching their real nav, not every page in the
  // app), after the browser is idle so it never competes with what's on screen
  // right now. Reports is always excluded — its charting library is the one
  // deliberately large piece, and pre-loading it for everyone on every login was
  // a real bug: the comment here used to claim it was skipped when the code
  // never actually did that, silently downloading ~400KB nobody asked for.
  useEffect(() => {
    if (!user) return;
    const PAGE_IMPORTERS = {
      "/": () => import("./pages/Dashboard.jsx"),
      "/bookings": () => import("./pages/Bookings.jsx"),
      "/customers": () => import("./pages/Customers.jsx"),
      "/services": () => import("./pages/Services.jsx"),
      "/sales": () => import("./pages/Sales.jsx"),
      "/finance": () => import("./pages/Finance.jsx"),
      "/inventory": () => import("./pages/Inventory.jsx"),
      "/marketing": () => import("./pages/Marketing.jsx"),
      "/staff": () => import("./pages/Staff.jsx"),
      "/messages": () => import("./pages/Messages.jsx"),
      "/compliance": () => import("./pages/Compliance.jsx"),
      "/settings": () => import("./pages/Settings.jsx"),
      // "/reports" deliberately has no entry here — see comment above. Business
      // Plan is now a tab inside Reports, so it's excluded for the same reason.
    };
    const warmers = NAV.filter((n) => n.roles.includes(user.role) && PAGE_IMPORTERS[n.to]).map((n) => PAGE_IMPORTERS[n.to]);
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1000));
    const cancelIdle = window.cancelIdleCallback || clearTimeout;
    let cancelled = false;
    let handle;
    const runNext = (i) => {
      if (cancelled || i >= warmers.length) return;
      handle = idle(() => { warmers[i](); runNext(i + 1); });
    };
    runNext(0);
    return () => { cancelled = true; if (handle) cancelIdle(handle); };
  }, [user]);

  useEffect(() => {
    if (user) api.getLocations().then(setLocations).catch(() => {});
  }, [user]);

  const handleLogin = (token, u) => { setToken(token); setUser(u); };
  const handleLogout = () => { setToken(null); setUser(null); };

  if (loading) {
    return (
      <LoadingScreen
        backgroundColor={publicBrand?.loading_background_color}
        logoUrl={publicBrand?.logo_url}
        businessName={publicBrand?.business_name}
        status={bootStatus}
        onRetry={bootError ? checkAuth : undefined}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pay/:code" element={<Suspense fallback={<div style={{ color: C.textSoft }}>Loading…</div>}><PaymentInfoPage /></Suspense>} />
        <Route path="*" element={
          !user ? (
            <Login onLogin={handleLogin} />
          ) : (
            <UserContext.Provider value={{ user }}>
            <BranchContext.Provider value={{ loc, setLoc, locations }}>
              <Shell user={user} onLogout={handleLogout} onUserUpdate={setUser}>
                <Suspense fallback={<div style={{ color: C.textSoft }}>Loading…</div>}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/customers" element={<Customers />} />
                <Route path="/services" element={<Services />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/marketing" element={<Marketing />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/menu" element={<MenuGrid />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </Shell>
        </BranchContext.Provider>
        </UserContext.Provider>
          )
        } />
      </Routes>
    </BrowserRouter>
  );
}
