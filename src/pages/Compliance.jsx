import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useUser } from "../App.jsx";
import FileDropzone from "../components/FileDropzone.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import CustomDatePicker from "../components/CustomDatePicker.jsx";
import { Paperclip, Printer } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", amberBg: "#FEF3C7", amberDeep: "#92400E", dangerBg: "#FEE2E2", danger: "#DC2626", successBg: "#E6F4EA" };
const STATUS_STYLE = {
  Open: { bg: "#F1F2F4", fg: C.textSoft }, "In Progress": { bg: C.amberBg, fg: C.amberDeep },
  Submitted: { bg: "#EEF2FF", fg: "#1745B3" }, Done: { bg: C.successBg, fg: "#166534" }, Rejected: { bg: C.dangerBg, fg: C.danger },
};

function TaskRow({ t, canReview, load }) {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [comment, setComment] = useState("");

  const sc = STATUS_STYLE[t.status] || STATUS_STYLE.Open;
  const startWork = async () => { await api.setTaskStatus(t.id, "In Progress"); load(); };
  const submitWork = async () => {
    await api.submitTask(t.id, attachment?.url, attachment?.name);
    setSubmitOpen(false); setAttachment(null);
    load();
  };
  const approve = async () => { await api.reviewTask(t.id, true, comment); setReviewOpen(false); setComment(""); load(); };
  const reject = async () => {
    if (!comment.trim()) return;
    await api.reviewTask(t.id, false, comment);
    setReviewOpen(false); setComment("");
    load();
  };

  return (
    <div className="px-5 py-3" style={{ borderTop: "1px solid " + C.border }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div style={{ color: C.ink }} className="text-sm font-semibold">{t.title}</div>
          <div style={{ color: C.textSoft }} className="text-xs">{t.assigned_to_name || "Unassigned"} · due {t.due_date ? new Date(t.due_date).toLocaleDateString() : "no date"}</div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ background: sc.bg, color: sc.fg }} className="text-xs font-semibold px-2.5 py-1 rounded-full">{t.status}</span>
          {t.status === "Open" && <button onClick={startWork} className="text-xs font-semibold" style={{ color: C.cyan }}>Start</button>}
          {(t.status === "In Progress" || t.status === "Rejected") && <button onClick={() => setSubmitOpen(true)} className="text-xs font-semibold" style={{ color: C.cyan }}>Submit for Review</button>}
          {t.status === "Submitted" && canReview && <button onClick={() => setReviewOpen(true)} className="text-xs font-semibold" style={{ color: C.cyan }}>Review</button>}
        </div>
      </div>

      {t.status === "Submitted" && t.attachment_url && (
        <a href={t.attachment_url} target="_blank" rel="noreferrer" style={{ color: C.cyan }} className="text-xs underline mt-1 flex items-center gap-1"><Paperclip size={11} /> {t.attachment_name || "View submitted file"}</a>
      )}
      {t.status === "Rejected" && t.review_comment && (
        <div style={{ background: C.dangerBg, color: C.danger }} className="rounded-lg px-3 py-2 text-xs mt-2">Returned by {t.reviewed_by_name}: {t.review_comment}</div>
      )}
      {t.status === "Done" && t.review_comment && (
        <div style={{ color: C.textSoft }} className="text-xs mt-1">Approved by {t.reviewed_by_name}{t.review_comment ? ` — "${t.review_comment}"` : ""}</div>
      )}

      {submitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Submit "{t.title}" for Review</div>
            <div style={{ color: C.textSoft }} className="text-xs mb-2">Attach the completed form or document.</div>
            <FileDropzone label="Drop the completed file here" onUploaded={(f) => setAttachment(f)} />
            {attachment && <div style={{ color: "#166534" }} className="text-xs mt-2">Attached: {attachment.name}</div>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setSubmitOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button onClick={submitWork} style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Submit</button>
            </div>
          </div>
        </div>
      )}

      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-2">Review "{t.title}"</div>
            {t.attachment_url && <a href={t.attachment_url} target="_blank" rel="noreferrer" style={{ color: C.cyan }} className="text-xs underline flex items-center gap-1 mb-3"><Paperclip size={11} /> {t.attachment_name || "View submitted file"}</a>}
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Comment (required if returning)</label>
            <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <div className="flex gap-2">
              <button onClick={() => setReviewOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button onClick={reject} style={{ background: C.danger }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Return</button>
              <button onClick={approve} style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Compliance() {
  const { user } = useUser();
  const canEdit = user?.role === "owner" || user?.role === "manager";
  const [tasks, setTasks] = useState([]);
  const [taxItems, setTaxItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskForm, setTaskForm] = useState({ title: "", dueDate: "" });
  const [taxForm, setTaxForm] = useState({ name: "", dueDate: "" });
  const [open, setOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);

  const load = () => Promise.all([api.getTasks(), api.getTaxItems(), api.getCategories("task_template")]).then(([t, x, tpl]) => { setTasks(t); setTaxItems(x); setTemplates(tpl); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAssignTask = async (e) => { e.preventDefault(); await api.addTask(taskForm); setTaskForm({ title: "", dueDate: "" }); setOpen(false); load(); };
  const handleAddTax = async (e) => { e.preventDefault(); await api.addTaxItem(taxForm); setTaxForm({ name: "", dueDate: "" }); setTaxOpen(false); load(); };
  const fileTax = async (id) => { await api.fileTaxItem(id); load(); };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Compliance & Tasks</h1>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => setTaxOpen(true)} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-sm font-semibold px-4 py-2 rounded-lg">+ Add Tax Item</button>
            <button onClick={() => setOpen(true)} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Assign Task</button>
          </div>
        )}
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Tax & compliance deadlines</div>
      <div className="flex justify-end mb-2">
        <button onClick={() => window.print()} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Printer size={13} /> Print Filings</button>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden mb-6">
        {taxItems.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>Nothing tracked yet.</div>}
        {taxItems.map((t, i) => (
          <div key={t.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{t.name}</div>
              <div style={{ color: C.textSoft }} className="text-xs">Due {new Date(t.due_date).toLocaleDateString()}</div>
            </div>
            {t.status === "Filed" ? (
              <span style={{ color: "#166534" }} className="text-xs font-semibold">Filed</span>
            ) : canEdit ? (
              <button onClick={() => fileTax(t.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>Mark Filed</button>
            ) : (
              <span style={{ color: C.textSoft }} className="text-xs">Pending</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Tasks</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {tasks.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No tasks assigned.</div>}
        {tasks.map((t) => <TaskRow key={t.id} t={t} canReview={canEdit} load={load} />)}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={handleAssignTask} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Assign Task</div>
            {templates.length > 0 && (
              <>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Choose from templates</label>
                <div className="mb-3">
                  <CustomSelect value="" onChange={(v) => setTaskForm({ ...taskForm, title: v })} placeholder="Select a template (or type your own below)…" options={templates.map((t) => ({ value: t.name, label: t.name }))} />
                </div>
              </>
            )}
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Task</label>
            <input required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Due date</label>
            <div className="mb-4">
              <CustomDatePicker value={taskForm.dueDate} onChange={(v) => setTaskForm({ ...taskForm, dueDate: v })} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Save</button>
            </div>
          </form>
        </div>
      )}

      {taxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={handleAddTax} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Add Tax / Compliance Item</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Name</label>
            <input required value={taxForm.name} onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })} placeholder="e.g. VAT Return" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Due date</label>
            <div className="mb-4">
              <CustomDatePicker value={taxForm.dueDate} onChange={(v) => setTaxForm({ ...taxForm, dueDate: v })} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setTaxOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
