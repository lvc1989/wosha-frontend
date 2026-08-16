import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3, Target } from "lucide-react";
import { C } from "../App.jsx";
import { PageHeader } from "../components/ui.jsx";
import PerformanceTab from "../components/reports-tabs/PerformanceTab.jsx";
import PlanTab from "../components/reports-tabs/PlanTab.jsx";

const TABS = [
  { key: "performance", label: "Performance", icon: BarChart3, component: PerformanceTab },
  { key: "plan", label: "Business Plan", icon: Target, component: PlanTab },
];

// What actually happened (Performance — real revenue, expenses, bookings) next
// to what you're aiming for (Business Plan — targets, budget) — the whole
// point of a budget is comparing it against actuals, so keeping them one tab
// switch apart instead of two separate pages makes that comparison natural.
export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = TABS.some((t) => t.key === tabParam) ? tabParam : "performance";
  const setTab = (key) => setSearchParams({ tab: key });
  const Active = TABS.find((t) => t.key === tab).component;

  return (
    <div>
      <PageHeader title="Reports" subtitle="Performance and business plan" />

      <div className="flex items-center gap-1 mb-5 bg-white rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ background: tab === t.key ? C.cyan : "transparent", color: tab === t.key ? "#fff" : C.textSoft }}
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
