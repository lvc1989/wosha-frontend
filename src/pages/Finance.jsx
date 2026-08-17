import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditCard, Wallet, TrendingUp } from "lucide-react";
import { C } from "../App.jsx";
import { PageHeader } from "../components/ui.jsx";
import InvoicingTab from "../components/finance-tabs/InvoicingTab.jsx";
import ExpensesTab from "../components/finance-tabs/ExpensesTab.jsx";
import CashFlowTab from "../components/finance-tabs/CashFlowTab.jsx";

const TABS = [
  { key: "invoicing", label: "Invoicing", icon: CreditCard, component: InvoicingTab },
  { key: "expenses", label: "Expenses", icon: Wallet, component: ExpensesTab },
  { key: "cashflow", label: "Cash Flow", icon: TrendingUp, component: CashFlowTab },
];

// Money in, money out, and the combined picture — three views of the same
// financial reality, now three tabs instead of three separate pages. Each
// tab's logic and state is unchanged from its original page. The active tab
// reads from the URL (?tab=expenses) so deep links keep working.
export default function Finance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = TABS.some((t) => t.key === tabParam) ? tabParam : "invoicing";
  const setTab = (key) => setSearchParams({ tab: key });
  const Active = TABS.find((t) => t.key === tab).component;

  return (
    <div>
      <PageHeader title="Finance" subtitle="Invoicing, expenses, and cash flow" />

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
