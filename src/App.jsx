import React, { useState, useEffect, createContext, useContext, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { api, setToken } from "./api.js";
import Login from "./pages/Login.jsx";

// Lazy-loaded: each page's code (and anything heavy it pulls in, like Reports' charting
// library) only downloads when that page is actually visited, instead of every page's
// code being bundled into one huge file loaded up front on every visit.
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
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

// Same order, labels, and role visibility as the final prototype. Pages not yet built
// in this real version route to an honest "coming soon" placeholder instead of a dead link.
const NAV = [
  { to: "/", label: "Dashboard", roles: ["owner", "manager", "staff"] },
  { to: "/bookings", label: "Bookings", roles: ["owner", "manager", "staff"] },
  { to: "/customers", label: "Customers", roles: ["owner", "manager", "staff"] },
  { to: "/services", label: "Services & Products", roles: ["owner", "manager", "staff"] },
  { to: "/jobs", label: "Job Board", roles: ["owner", "manager", "staff"] },
  { to: "/sales", label: "Record Sale", roles: ["owner", "manager", "staff"] },
  { to: "/invoicing", label: "Invoicing", roles: ["owner", "manager", "staff"] },
  { to: "/inventory", label: "Inventory & Supply", roles: ["owner", "manager", "staff"] },
  { to: "/store", label: "Store", roles: ["owner", "manager", "staff"] },
  { to: "/expenses", label: "Expenses", roles: ["owner", "manager", "staff"] },
  { to: "/purchase-orders", label: "Purchase Orders", roles: ["owner", "manager"] },
  { to: "/suppliers", label: "Suppliers", roles: ["owner", "manager"] },
  { to: "/cashflow", label: "Cash Flow", roles: ["owner", "manager"] },
  { to: "/marketing", label: "Marketing", roles: ["owner", "manager"] },
  { to: "/staff", label: "Staff", roles: ["owner", "manager"] },
  { to: "/teamchat", label: "Team Chat", roles: ["owner", "manager", "staff"] },
  { to: "/clientchat", label: "Client Messages", roles: ["owner", "manager", "staff"] },
  { to: "/compliance", label: "Compliance & Tasks", roles: ["owner", "manager", "staff"] },
  { to: "/reports", label: "Reports", roles: ["owner", "manager"] },
  { to: "/settings", label: "Settings", roles: ["owner"] },
  { to: "/business-plan", label: "Business Plan", roles: ["owner"] },
];

function Shell({ user, onLogout, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { loc, setLoc, locations } = useBranch();
  const [reminders, setReminders] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [brand, setBrand] = useState(null);
  const nav = NAV.filter((n) => n.roles.includes(user.role));

  useEffect(() => {
    const load = () => api.getReminders().then(setReminders).catch(() => {});
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { api.getSettings().then(setBrand).catch(() => {}); }, []);

  const logoPx = { sm: 24, md: 32, lg: 40 }[brand?.logo_size || "md"];

  return (
    <div style={{ background: C.bg, fontFamily: bodyFont, color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
        .wosha-fixed-topstrip { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; height: 60px; border-bottom: 1px solid ${C.border}; }
        .wosha-fixed-sidebar { position: fixed; top: 60px; left: 0; bottom: 0; width: 230px; z-index: 45; overflow-y: auto; }
        .wosha-fixed-main { position: fixed; top: 60px; left: 230px; right: 0; bottom: 0; overflow-y: auto; z-index: 40; }
        .wosha-logo-strip { width: 230px; }
        @media (max-width: 767px) {
          .wosha-fixed-sidebar { width: 130px !important; }
          .wosha-fixed-main { left: 130px !important; padding: 1rem !important; }
          .wosha-logo-strip { width: 130px !important; }
          .wosha-navlink { font-size: 12px !important; line-height: 1.3 !important; }
        }
      `}</style>

      <div className="wosha-fixed-topstrip">
        <button onClick={() => navigate("/")} style={{ background: C.ink }} className="wosha-logo-strip flex items-center gap-2 px-4 shrink-0 text-left">
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
            <select value={loc} onChange={(e) => setLoc(e.target.value)} style={{ borderColor: C.border, fontFamily: bodyFont }} className="border rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm max-w-[100px] sm:max-w-none">
              <option value="all">All Branches</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          )}
          <div className="relative">
            <button onClick={() => setBellOpen((v) => !v)} className="relative">
              🔔
              {reminders.length > 0 && <span style={{ background: C.danger }} className="absolute -top-1.5 -right-1.5 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{reminders.length}</span>}
            </button>
            {bellOpen && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(11,27,51,0.15)" }} className="absolute right-0 top-8 rounded-xl overflow-hidden w-80 max-h-96 overflow-y-auto">
                {reminders.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>Nothing needs your attention right now.</div>}
                {reminders.map((r) => (
                  <div key={r.id} className="px-4 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
                    <div style={{ color: r.urgent ? C.danger : C.text }} className="text-sm font-medium">{r.label}</div>
                    <div style={{ color: C.textSoft }} className="text-xs">{r.kind}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ color: C.textSoft }} className="text-xs hidden sm:block">{user?.name} · {user?.role}</div>
          <button onClick={onLogout} style={{ color: C.cyanDeep }} className="text-xs font-semibold">Log out</button>
        </div>
      </div>

      <aside style={{ background: C.ink }} className="wosha-fixed-sidebar flex flex-col py-4 px-2">
        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} title={n.label}
              style={{ background: location.pathname === n.to ? "rgba(255,255,255,0.1)" : "transparent", color: location.pathname === n.to ? "#fff" : "rgba(255,255,255,0.65)" }}
              className="wosha-navlink px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center sm:justify-start">
              <span className="wosha-navlabel">{n.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="wosha-fixed-main p-8">{children}</div>
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

  useEffect(() => {
    if (user) api.getLocations().then(setLocations).catch(() => {});
  }, [user]);

  const handleLogin = (token, u) => { setToken(token); setUser(u); };
  const handleLogout = () => { setToken(null); setUser(null); };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg, color: C.ink }}>Loading…</div>;

  return (
    <BrowserRouter>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <UserContext.Provider value={{ user }}>
        <BranchContext.Provider value={{ loc, setLoc, locations }}>
          <Shell user={user} onLogout={handleLogout}>
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
      )}
    </BrowserRouter>
  );
}
