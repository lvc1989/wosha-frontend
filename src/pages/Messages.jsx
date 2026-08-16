import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageCircle, Mail } from "lucide-react";
import { C } from "../App.jsx";
import { PageHeader } from "../components/ui.jsx";
import TeamTab from "../components/messages-tabs/TeamTab.jsx";
import ClientTab from "../components/messages-tabs/ClientTab.jsx";

const TABS = [
  { key: "team", label: "Team", icon: MessageCircle, component: TeamTab },
  { key: "clients", label: "Clients", icon: Mail, component: ClientTab },
];

// Both are chat interfaces, just different audiences — internal staff vs
// external customers. Now one section, two tabs, instead of two separate
// pages that happened to both be messaging. Each tab's logic is unchanged
// from its original page — Clients keeps its own internal Individual/Groups
// toggle exactly as it was.
export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = TABS.some((t) => t.key === tabParam) ? tabParam : "team";
  const setTab = (key) => setSearchParams({ tab: key });
  const Active = TABS.find((t) => t.key === tab).component;

  return (
    <div>
      <PageHeader title="Messages" subtitle="Team chat and client conversations" />

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
