import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { api, setToken } from "./api.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Customers from "./pages/Customers.jsx";
import Bookings from "./pages/Bookings.jsx";
import Invoicing from "./pages/Invoicing.jsx";
import Staff from "./pages/Staff.jsx";
import Inventory from "./pages/Inventory.jsx";
import Expenses from "./pages/Expenses.jsx";
import PurchaseOrders from "./pages/PurchaseOrders.jsx";
import Marketing from "./pages/Marketing.jsx";
import CashFlow from "./pages/CashFlow.jsx";
import Compliance from "./pages/Compliance.jsx";
import BusinessPlan from "./pages/BusinessPlan.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", cyanDeep: "#1745B3", amber: "#FFC93C", bg: "#F5F7FA", border: "#E4E7EC" };

function Shell({ user, onLogout, children }) {
  const nav = [
    { to: "/", label: "Dashboard" },
    { to: "/customers", label: "Customers" },
    { to: "/bookings", label: "Bookings" },
    { to: "/invoicing", label: "Invoicing" },
    { to: "/inventory", label: "Inventory" },
    { to: "/purchase-orders", label: "Purchase Orders" },
    { to: "/expenses", label: "Expenses" },
    { to: "/staff", label: "Staff" },
    { to: "/marketing", label: "Marketing" },
    { to: "/cashflow", label: "Cash Flow" },
    { to: "/compliance", label: "Compliance & Tasks" },
    { to: "/business-plan", label: "Business Plan" },
  ];
  const location = useLocation();
  return (
    <div className="flex min-h-screen" style={{ background: C.bg }}>
      <aside style={{ background: C.ink }} className="w-56 shrink-0 flex flex-col py-6 px-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.amber})` }} className="w-8 h-8 rounded-lg" />
          <span className="text-white text-lg font-bold">Wosha</span>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to}
              style={{ background: location.pathname === n.to ? "rgba(255,255,255,0.1)" : "transparent" }}
              className="text-white/70 hover:text-white px-3 py-2 rounded-lg text-sm font-medium">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-2">
          <div className="text-white/50 text-xs mb-2">{user?.name} · {user?.role}</div>
          <button onClick={onLogout} className="text-white/70 hover:text-white text-xs font-semibold">Log out</button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then(setUser).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  const handleLogin = (token, u) => { setToken(token); setUser(u); };
  const handleLogout = () => { setToken(null); setUser(null); };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg, color: C.ink }}>Loading…</div>;

  return (
    <BrowserRouter>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Shell user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/invoicing" element={<Invoicing />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/cashflow" element={<CashFlow />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/business-plan" element={<BusinessPlan />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Shell>
      )}
    </BrowserRouter>
  );
}

export { C };
