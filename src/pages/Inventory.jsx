import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, Truck as StoreIcon, ClipboardList, Truck } from "lucide-react";
import { C } from "../App.jsx";
import { PageHeader } from "../components/ui.jsx";
import StockTab from "../components/inventory-tabs/StockTab.jsx";
import ReceiveTab from "../components/inventory-tabs/ReceiveTab.jsx";
import PurchaseOrdersTab from "../components/inventory-tabs/PurchaseOrdersTab.jsx";
import SuppliersTab from "../components/inventory-tabs/SuppliersTab.jsx";

const TABS = [
  { key: "stock", label: "Stock", icon: Package, component: StockTab },
  { key: "receive", label: "Receive", icon: StoreIcon, component: ReceiveTab },
  { key: "orders", label: "Purchase Orders", icon: ClipboardList, component: PurchaseOrdersTab },
  { key: "suppliers", label: "Suppliers", icon: Truck, component: SuppliersTab },
];

// The full supply chain in one place: what you have, receiving it, ordering
// more, and who you order from — four pages that were always really one
// workflow, now four tabs of it. Each tab's own logic and state is completely
// unchanged from its original page; only how you get to it changed. The active
// tab reads from the URL (?tab=orders) rather than being purely local state, so
// a deep link — like a reminder about a specific purchase order — can open
// straight to the right tab instead of always landing on Stock by default.
export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = TABS.some((t) => t.key === tabParam) ? tabParam : "stock";
  const setTab = (key) => setSearchParams({ tab: key });
  const Active = TABS.find((t) => t.key === tab).component;

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Stock, receiving, ordering, and suppliers" />

      <div className="flex items-center gap-1 mb-5 bg-white rounded-lg p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ background: tab === t.key ? C.cyan : "#fff", color: tab === t.key ? "#fff" : C.textSoft, border: tab === t.key ? "1px solid " + C.cyan : "1px solid " + C.border }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md"
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <Active />
    </div>
  );
}
