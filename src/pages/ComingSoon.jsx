import React from "react";
import { Construction } from "lucide-react";
import { C } from "../App.jsx";
import { PageHeader, EmptyState } from "../components/ui.jsx";

export default function ComingSoon({ title }) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="bg-white rounded-xl">
        <EmptyState
          icon={Construction}
          title="Not built yet"
          body="This page existed in the prototype but hasn't been rebuilt on the real backend yet. This isn't a bug — it's an honest placeholder rather than a broken link. Ask for this module by name and it'll be built next."
        />
      </div>
    </div>
  );
}
