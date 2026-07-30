import React, { useState, useEffect } from "react";
import { api } from "../api.js";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", amberBg: "#FEF3C7", amberDeep: "#92400E" };

export default function Compliance() {
  const [tasks, setTasks] = useState([]);
  const [taxItems, setTaxItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskForm, setTaskForm] = useState({ title: "", dueDate: "" });
  const [open, setOpen] = useState(false);

  const load = () => Promise.all([api.getTasks(), api.getTaxItems()]).then(([t, x]) => { setTasks(t); setTaxItems(x); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submitTask = async (e) => { e.preventDefault(); await api.addTask(taskForm); setTaskForm({ title: "", dueDate: "" }); setOpen(false); load(); };
  const markDone = async (id) => { await api.setTaskStatus(id, "Done"); load(); };
  const fileTax = async (id) => { await api.fileTaxItem(id); load(); };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Compliance & Tasks</h1>
        <button onClick={() => setOpen(true)} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Assign Task</button>
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Tax & compliance deadlines</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden mb-6">
        {taxItems.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>Nothing tracked yet.</div>}
        {taxItems.map((t, i) => (
          <div key={t.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{t.name}</div>
              <div style={{ color: C.textSoft }} className="text-xs">Due {new Date(t.due_date).toLocaleDateString()}</div>
            </div>
            {t.status === "Filed" ? (
              <span style={{ color: "#166534" }} className="text-xs font-semibold">Filed</span>
            ) : (
              <button onClick={() => fileTax(t.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>Mark Filed</button>
            )}
          </div>
        ))}
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Tasks</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {tasks.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No tasks assigned.</div>}
        {tasks.map((t, i) => (
          <div key={t.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{t.title}</div>
              <div style={{ color: C.textSoft }} className="text-xs">{t.assigned_to_name || "Unassigned"} · due {t.due_date ? new Date(t.due_date).toLocaleDateString() : "no date"}</div>
            </div>
            {t.status === "Done" ? (
              <span style={{ color: "#166534" }} className="text-xs font-semibold">Done</span>
            ) : (
              <button onClick={() => markDone(t.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>Mark Done</button>
            )}
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submitTask} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Assign Task</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Task</label>
            <input required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Due date</label>
            <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
