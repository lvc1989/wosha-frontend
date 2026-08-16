import React, { useState, useEffect } from "react";
import { api } from "../../api.js";
import { useBranch, useUser, C } from "../../App.jsx";
import CustomSelect from "../CustomSelect.jsx";
import CustomDatePicker from "../CustomDatePicker.jsx";
import { Plus, Wand2, Pause, Play, X } from "lucide-react";
import { StatusPill, Button, Modal, FieldLabel, EmptyState, LoadingState } from "../ui.jsx";

const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const startOfWeek = (d) => { const x = new Date(d); const day = x.getDay(); x.setDate(x.getDate() - day); return x; };
const FLOW = ["Scheduled", "In Progress", "Done"];

// Genuinely distinct from Bookings (customer appointments) and Manual Jobs
// (one-off ad-hoc tasks) — this is a real, date-based staff activity roster:
// who's doing what, this week, whether the auto-scheduler assigned it or a
// manager set it by hand. Anything here — auto or manual — is always
// editable, reassignable, or removable by a manager, GM, or owner.
export default function RosterTab() {
  const { loc, locations } = useBranch();
  const { user } = useUser();
  const canEdit = user?.role === "owner" || user?.role === "manager";

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [entries, setEntries] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activities, setActivities] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [genOpen, setGenOpen] = useState(false);
  const [genBranch, setGenBranch] = useState(loc !== "all" ? loc : (locations[0]?.id || ""));
  const [genBusy, setGenBusy] = useState(false);
  const [genMsg, setGenMsg] = useState("");

  const [entryOpen, setEntryOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const blankForm = { locationId: loc !== "all" ? loc : (locations[0]?.id || ""), technicianId: "", activity: "", rosterDate: toDateStr(new Date()), notes: "" };
  const [form, setForm] = useState(blankForm);

  const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return toDateStr(d); });

  const load = () => Promise.all([
    api.getRoster(loc, weekDates[0], weekDates[6]),
    api.getStaff(),
    api.getCategories("roster_activity"),
    api.getRosterSettings(),
  ]).then(([e, s, a, st]) => { setEntries(e); setStaff(s); setActivities(a); setSettings(st); }).finally(() => setLoading(false));
  useEffect(() => { setLoading(true); load(); }, [loc, weekStart.getTime()]);

  const activeStaff = staff.filter((s) => s.active !== false && (loc === "all" || s.location_id === loc));

  const openGenerate = () => { setGenBranch(loc !== "all" ? loc : (locations[0]?.id || "")); setGenMsg(""); setGenOpen(true); };
  const runGenerate = async () => {
    setGenBusy(true);
    setGenMsg("");
    try {
      const res = await api.autoGenerateRoster({ locationId: genBranch, from: weekDates[0], to: weekDates[6] });
      setGenMsg(`Generated ${res.count} entries for the week.`);
      load();
    } catch (err) {
      setGenMsg(err.message);
    }
    setGenBusy(false);
  };

  const toggleScheduler = async () => {
    const updated = await api.updateRosterSettings({ autoSchedulerEnabled: !settings.auto_scheduler_enabled });
    setSettings(updated);
  };

  const openAdd = (dateStr) => { setEditing(null); setForm({ ...blankForm, rosterDate: dateStr || blankForm.rosterDate }); setEntryOpen(true); };
  const openEdit = (e) => { setEditing(e.id); setForm({ locationId: e.location_id, technicianId: e.technician_id, activity: e.activity, rosterDate: e.roster_date.slice(0, 10), notes: e.notes || "" }); setEntryOpen(true); };
  const submit = async (e) => {
    e.preventDefault();
    if (editing) await api.updateRosterEntry(editing, form);
    else await api.addRosterEntry(form);
    setEntryOpen(false);
    load();
  };
  const advance = async (id) => { await api.advanceRosterEntry(id); load(); };
  const remove = async (id) => { await api.removeRosterEntry(id); load(); };

  if (loading) return <LoadingState />;

  const weekLabel = new Date(weekDates[0]).toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " – " + new Date(weekDates[6]).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg">←</button>
          <span style={{ color: C.ink }} className="text-sm font-semibold">{weekLabel}</span>
          <button onClick={() => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg">→</button>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleScheduler}
              style={{ border: `1px solid ${C.border}`, color: settings?.auto_scheduler_enabled ? C.ink : C.amberDeep }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              {settings?.auto_scheduler_enabled ? <><Pause size={13} /> Pause auto-scheduler</> : <><Play size={13} /> Resume auto-scheduler</>}
            </button>
            <Button variant="ghost" onClick={openGenerate} disabled={!settings?.auto_scheduler_enabled}><span className="flex items-center gap-1.5"><Wand2 size={15} /> Auto-generate week</span></Button>
            <Button onClick={() => openAdd()}><span className="flex items-center gap-1.5"><Plus size={16} />Add entry</span></Button>
          </div>
        )}
      </div>

      {!settings?.auto_scheduler_enabled && (
        <div style={{ background: "#FAEEDA", color: C.amberDeep }} className="rounded-lg px-4 py-2 text-xs mb-4">
          The auto-scheduler is paused — manual entries below still work exactly as normal. Resume it any time.
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl"><EmptyState icon={Wand2} title="No roster entries this week" body="Auto-generate a week's assignments, or add entries one at a time." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeStaff.map((s) => {
            const mine = entries.filter((e) => e.technician_id === s.id).sort((a, b) => a.roster_date.localeCompare(b.roster_date));
            if (mine.length === 0) return null;
            return (
              <div key={s.id} className="bg-white rounded-2xl p-4">
                <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-sm font-semibold mb-3">{s.name}</div>
                <div className="flex flex-col gap-2">
                  {mine.map((e) => {
                    const tone = e.status === "Done" ? "success" : e.status === "In Progress" ? "amber" : "cyan";
                    return (
                      <div key={e.id} style={{ background: "#F5F7FA" }} className="rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span style={{ color: C.textSoft }} className="text-xs">{new Date(e.roster_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                          {e.auto_generated && <span style={{ color: C.textSoft }} className="text-[10px] uppercase tracking-wide">Auto</span>}
                        </div>
                        <div style={{ color: C.ink }} className="text-sm font-medium mb-2">{e.activity}</div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <StatusPill label={e.status} tone={tone} />
                          <div className="flex items-center gap-2">
                            {e.status !== "Done" && <button onClick={() => advance(e.id)} style={{ color: C.cyan }} className="text-xs font-semibold">Advance →</button>}
                            {canEdit && <button onClick={() => openEdit(e)} style={{ color: C.cyan }} className="text-xs font-semibold">Edit</button>}
                            {canEdit && <button onClick={() => remove(e.id)} style={{ color: C.amberDeep }} className="text-xs"><X size={13} /></button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={genOpen} onClose={() => setGenOpen(false)}>
        <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-2">Auto-generate this week's roster</div>
        <div style={{ color: C.textSoft }} className="text-xs mb-4">Randomly assigns every active staff member at the chosen branch to one activity each day for {weekLabel} — Neema might land on interior detail Monday and exterior wash Tuesday, entirely at random. Review and adjust anything afterward.</div>
        <FieldLabel>Branch</FieldLabel>
        <div className="mb-4">
          <CustomSelect required value={genBranch} onChange={setGenBranch} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
        </div>
        {genMsg && <div style={{ color: genMsg.startsWith("Generated") ? "#185FA5" : C.danger }} className="text-xs mb-3">{genMsg}</div>}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setGenOpen(false)} className="flex-1">Close</Button>
          <Button onClick={runGenerate} disabled={genBusy || !genBranch} className="flex-1">{genBusy ? "Generating…" : "Generate"}</Button>
        </div>
      </Modal>

      <Modal open={entryOpen} onClose={() => setEntryOpen(false)}>
        <form onSubmit={submit}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">{editing ? "Edit roster entry" : "Add roster entry"}</div>
          <FieldLabel>Branch</FieldLabel>
          <div className="mb-3">
            <CustomSelect required value={form.locationId} onChange={(v) => setForm({ ...form, locationId: v, technicianId: "" })} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
          </div>
          <FieldLabel>Staff member</FieldLabel>
          <div className="mb-3">
            <CustomSelect required value={form.technicianId} onChange={(v) => setForm({ ...form, technicianId: v })} options={staff.filter((s) => s.location_id === form.locationId).map((s) => ({ value: s.id, label: s.name }))} />
          </div>
          <FieldLabel>Activity</FieldLabel>
          <div className="mb-3">
            <CustomSelect required value={form.activity} onChange={(v) => setForm({ ...form, activity: v })} options={activities.map((a) => ({ value: a.name, label: a.name }))} />
          </div>
          <FieldLabel>Date</FieldLabel>
          <div className="mb-3">
            <CustomDatePicker value={form.rosterDate} onChange={(v) => setForm({ ...form, rosterDate: v })} className="w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between" style={{ borderColor: C.border }} />
          </div>
          <FieldLabel>Notes (optional)</FieldLabel>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setEntryOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editing ? "Save changes" : "Add entry"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
