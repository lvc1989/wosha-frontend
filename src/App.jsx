import React, { useState, useEffect, useRef, createContext, useContext, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { api, setToken } from "./api.js";
import Login from "./pages/Login.jsx";
import AccountMenu from "./AccountMenu.jsx";
import CustomSelect from "./components/CustomSelect.jsx";

// Lazy-loaded: each page's code (and anything heavy it pulls in, like Reports' charting
// library) only downloads when that page is actually visited, instead of every page's
// code being bundled into one huge file loaded up front on every visit.
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const PaymentInfoPage = lazy(() => import("./pages/PaymentInfoPage.jsx"));
const Customers = lazy(() => import("./pages/Customers.jsx"));
const Bookings = lazy(() => import("./pages/Bookings.jsx"));
const Invoicing = lazy(() => import("./pages/Invoicing.jsx"));
const Services = lazy(() => import("./pages/Services.jsx"));
const Staff = lazy(() => import("./pages/Staff.jsx"));
const Inventory = lazy(() => import("./pages/Inventory.jsx"));
const Expenses = lazy(() => import("./pages/Expenses.jsx"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders.jsx"));
const Suppliers = lazy(() => import("./pages/Suppliers.jsx"));
const Marketing = lazy(() => import("./pages/Marketing.jsx"));
const CashFlow = lazy(() => import("./pages/CashFlow.jsx"));
const Compliance = lazy(() => import("./pages/Compliance.jsx"));
const BusinessPlan = lazy(() => import("./pages/BusinessPlan.jsx"));
const JobBoard = lazy(() => import("./pages/JobBoard.jsx"));
const Sales = lazy(() => import("./pages/Sales.jsx"));
const Store = lazy(() => import("./pages/Store.jsx"));
const TeamChat = lazy(() => import("./pages/TeamChat.jsx"));
const ClientMessages = lazy(() => import("./pages/ClientMessages.jsx"));
const Reports = lazy(() => import("./pages/Reports.jsx"));
const SettingsPage = lazy(() => import("./pages/Settings.jsx"));
const ComingSoon = lazy(() => import("./pages/ComingSoon.jsx"));

// Exact tokens from the prototype — cyan/amber/violet are legacy internal names,
// their hex values carry Wosha's real blue/yellow/near-black palette.
export const C = {
  ink: "#0B1B33", inkSoft: "#132A4D", bg: "#F5F7FA", card: "#FFFFFF",
  cyan: "#2B6CF6", cyanDeep: "#1745B3", amber: "#FFC93C", amberDeep: "#966B00",
  violet: "#1F2937", text: "#0F172A", textSoft: "#64748B", border: "#E4E9F0",
  danger: "#DC2626", successBg: "#E8F1FF", amberBg: "#FFF6DC", dangerBg: "#FDE8E7",
};
export const displayFont = "'Space Grotesk', 'Segoe UI', sans-serif";
export const bodyFont = "'Inter', 'Segoe UI', sans-serif";
export const monoFont = "'IBM Plex Mono', monospace";

export const BranchContext = createContext({ loc: "all", setLoc: () => {}, locations: [] });
export const useBranch = () => useContext(BranchContext);

export const UserContext = createContext({ user: null });
export const useUser = () => useContext(UserContext);

export const BrandContext = createContext({ brand: null, refreshBrand: () => {} });
export const useBrand = () => useContext(BrandContext);

// Same order, labels, and role visibility as the final prototype. Pages not yet built
// in this real version route to an honest "coming soon" placeholder instead of a dead link.
import {
  Home, Calendar, Users, Droplets, LayoutGrid, Receipt, CreditCard, Package,
  Store as StoreIcon, Wallet, ClipboardList, Truck, TrendingUp, Megaphone,
  UserCog, MessageCircle, Mail, ShieldCheck, BarChart3, Settings as SettingsIcon,
  LineChart, Bell, ChevronDown, ChevronUp,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: Home, roles: ["owner", "manager", "staff"] },
  { to: "/bookings", label: "Bookings", icon: Calendar, roles: ["owner", "manager", "staff"] },
  { to: "/customers", label: "Customers", icon: Users, roles: ["owner", "manager", "staff"] },
  { to: "/services", label: "Services & Products", icon: Droplets, roles: ["owner", "manager", "staff"] },
  { to: "/jobs", label: "Job Board", icon: LayoutGrid, roles: ["owner", "manager", "staff"] },
  { to: "/sales", label: "Record Sale", icon: Receipt, roles: ["owner", "manager", "staff"] },
  { to: "/invoicing", label: "Invoicing", icon: CreditCard, roles: ["owner", "manager", "staff"] },
  { to: "/inventory", label: "Inventory & Supply", icon: Package, roles: ["owner", "manager", "staff"] },
  { to: "/store", label: "Store", icon: StoreIcon, roles: ["owner", "manager", "staff"] },
  { to: "/expenses", label: "Expenses", icon: Wallet, roles: ["owner", "manager", "staff"] },
  { to: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList, roles: ["owner", "manager"] },
  { to: "/suppliers", label: "Suppliers", icon: Truck, roles: ["owner", "manager"] },
  { to: "/cashflow", label: "Cash Flow", icon: TrendingUp, roles: ["owner", "manager"] },
  { to: "/marketing", label: "Marketing", icon: Megaphone, roles: ["owner", "manager"] },
  { to: "/staff", label: "Staff", icon: UserCog, roles: ["owner", "manager"] },
  { to: "/teamchat", label: "Team Chat", icon: MessageCircle, roles: ["owner", "manager", "staff"] },
  { to: "/clientchat", label: "Client Messages", icon: Mail, roles: ["owner", "manager", "staff"] },
  { to: "/compliance", label: "Compliance & Tasks", icon: ShieldCheck, roles: ["owner", "manager", "staff"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["owner", "manager"] },
  { to: "/settings", label: "Settings", icon: SettingsIcon, roles: ["owner"] },
  { to: "/business-plan", label: "Business Plan", icon: LineChart, roles: ["owner", "manager"] },
];

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
  const nav = NAV.filter((n) => n.roles.includes(user.role));
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
    else if (r.kind === "Expense") navigate("/expenses");
    else if (r.kind === "Purchase Order") navigate("/purchase-orders");
    else if (r.kind === "New Customer") navigate(`/customers?edit=${r.customerId}`);
    else navigate("/");
  };

  const refreshBrand = () => api.getSettings().then(setBrand).catch(() => {});
  useEffect(() => { refreshBrand(); }, []);

  const logoPx = { sm: 24, md: 32, lg: 40 }[brand?.logo_size || "md"];

  return (
    <div className="wosha-app-shell" style={{ background: C.bg, fontFamily: bodyFont, color: C.text }}>
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
        <div style={{ background: C.card }} className="flex-1 flex items-center justify-end gap-2 sm:gap-3 px-3 sm:px-6">
          {locations.length > 0 && (
            <div style={{ width: 132 }}>
              <CustomSelect value={loc} onChange={setLoc} options={[{ value: "all", label: "All Branches" }, ...locations.map((l) => ({ value: l.id, label: l.name }))]} className="w-full border rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-left flex items-center justify-between" style={{ borderColor: C.border, fontFamily: bodyFont }} />
            </div>
          )}
          <div ref={bellRef} className="relative">
            <button onClick={() => setBellOpen((v) => !v)} className="relative" style={{ color: C.textSoft }}>
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

      <div className="wosha-fixed-main p-8"><BrandContext.Provider value={{ brand, refreshBrand }}>{children}</BrandContext.Provider></div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loc, setLoc] = useState("all");
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    api.me().then(setUser).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  // Once logged in, quietly download every other page's code in the background
  // (after the browser is idle, so it never competes with what's on screen right
  // now) — by the time someone actually taps a nav icon, it opens instantly instead
  // of waiting on a network request. Reports is skipped since its charting library
  // is the one deliberately large piece — no reason to make everyone download it
  // up front just in case they visit that one page.
  useEffect(() => {
    if (!user) return;
    const warmers = [
      () => import("./pages/Dashboard.jsx"), () => import("./pages/Customers.jsx"),
      () => import("./pages/Bookings.jsx"), () => import("./pages/Invoicing.jsx"),
      () => import("./pages/Services.jsx"), () => import("./pages/Staff.jsx"),
      () => import("./pages/Inventory.jsx"), () => import("./pages/Expenses.jsx"),
      () => import("./pages/PurchaseOrders.jsx"), () => import("./pages/Suppliers.jsx"),
      () => import("./pages/Marketing.jsx"), () => import("./pages/CashFlow.jsx"),
      () => import("./pages/Compliance.jsx"), () => import("./pages/BusinessPlan.jsx"),
      () => import("./pages/JobBoard.jsx"), () => import("./pages/Sales.jsx"),
      () => import("./pages/Store.jsx"), () => import("./pages/TeamChat.jsx"),
      () => import("./pages/ClientMessages.jsx"), () => import("./pages/Settings.jsx"),
      () => import("./pages/Reports.jsx"),
    ];
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

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg, color: C.ink }}>Loading…</div>;

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
                <Route path="/jobs" element={<JobBoard />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/invoicing" element={<Invoicing />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/store" element={<Store />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/marketing" element={<Marketing />} />
                <Route path="/cashflow" element={<CashFlow />} />
                <Route path="/teamchat" element={<TeamChat />} />
                <Route path="/clientchat" element={<ClientMessages />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/business-plan" element={<BusinessPlan />} />
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
