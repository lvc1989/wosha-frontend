import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, CalendarClock } from "lucide-react";
import { C } from "../App.jsx";
import { PageHeader } from "../components/ui.jsx";
import StaffTab from "../components/staff-tabs/StaffTab.jsx";
import RosterTab from "../components/staff-tabs/RosterTab.jsx";

const TABS = [
  { key: "staff", label: "Staff", icon: Users, component: StaffTab },
  { key: "roster", label: "Duty Roster", icon: CalendarClock, component: RosterTab },
];

// Staff management (people, payroll, logins) and the duty roster (who's doing
// what, which day) are related but genuinely different tasks — one tab each,
// so neither crowds the other.
export default function Staff() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = TABS.some((t) => t.key === tabParam) ? tabParam : "staff";
  const setTab = (key) => setSearchParams({ tab: key });
  const Active = TABS.find((t) => t.key === tab).component;

  return (
    <div>
      <PageHeader title="Staff" subtitle="People and the weekly duty roster" />

      <div className="flex items-center gap-1 mb-5 bg-white rounded-lg p-1 w-fit">
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
