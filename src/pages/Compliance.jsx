import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useUser, C } from "../App.jsx";
import FileDropzone from "../components/FileDropzone.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import CustomDatePicker from "../components/CustomDatePicker.jsx";
import { PrintHeader, PrintFooter } from "../components/PrintHeaderFooter.jsx";
import { Paperclip, Printer, ListChecks } from "lucide-react";
import { PageHeader, StatusPill, Button, Modal, FieldLabel, EmptyState, LoadingState } from "../components/ui.jsx";

const STATUS_TONE = { Open: "ink", "In Progress": "amber", Submitted: "cyan", Done: "success", Rejected: "danger" };

function TaskRow({ t, canReview, load }) {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [comment, setComment] = useState("");

  const tone = STATUS_TONE[t.status] || "ink";
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
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill label={t.status} tone={tone} />
          {t.status === "Open" && <button onClick={startWork} className="text-xs font-semibold" style={{ color: C.cyan }}>Start</button>}
          {(t.status === "In Progress" || t.status === "Rejected") && <button onClick={() => setSubmitOpen(true)} className="text-xs font-semibold" style={{ color: C.cyan }}>Submit for review</button>}
          {t.status === "Submitted" && canReview && <button onClick={() => setReviewOpen(true)} className="text-xs font-semibold" style={{ color: C.cyan }}>Review</button>}
        </div>
      </div>

      {t.status === "Submitted" && t.attachment_url && (
        <a href={t.attachment_url} target="_blank" rel="noreferrer" style={{ color: C.cyan }} className="text-xs underline mt-1 flex items-center gap-1"><Paperclip size={11} /> {t.attachment_name || "View submitted file"}</a>
      )}
      {t.status === "Rejected" && t.review_comment && (
        <div style={{ background: "#FDE8E7", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mt-2">Returned by {t.reviewed_by_name}: {t.review_comment}</div>
      )}
      {t.status === "Done" && t.review_comment && (
        <div style={{ color: C.textSoft }} className="text-xs mt-1">Approved by {t.reviewed_by_name}{t.review_comment ? " — \"" + t.review_comment + "\"" : ""}</div>
      )}

      <Modal open={submitOpen} onClose={() => setSubmitOpen(false)}>
        <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Submit "{t.title}" for review</div>
        <div style={{ color: C.textSoft }} className="text-xs mb-2">Attach the completed form or document.</div>
        <FileDropzone label="Drop the completed file here" onUploaded={(f) => setAttachment(f)} />
        {attachment && <div style={{ color: "#185FA5" }} className="text-xs mt-2">Attached: {attachment.name}</div>}
        <div className="flex gap-2 mt-4">
          <Button variant="ghost" onClick={() => setSubmitOpen(false)} className="flex-1">Cancel</Button>
          <Button onClick={submitWork} className="flex-1">Submit</Button>
        </div>
      </Modal>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)}>
        <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-2">Review "{t.title}"</div>
        {t.attachment_url && <a href={t.attachment_url} target="_blank" rel="noreferrer" style={{ color: C.cyan }} className="text-xs underline flex items-center gap-1 mb-3"><Paperclip size={11} /> {t.attachment_name || "View submitted file"}</a>}
        <FieldLabel>Comment (required if returning)</FieldLabel>
        <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setReviewOpen(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={reject} className="flex-1">Return</Button>
          <Button onClick={approve} className="flex-1">Approve</Button>
        </div>
      </Modal>
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

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Compliance & tasks"
        action={canEdit && (
          <div className="flex gap-2">
            <button onClick={() => setTaxOpen(true)} style={{ border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }} className="text-sm font-semibold px-4 py-2 rounded-lg">+ Add tax item</button>
            <Button onClick={() => setOpen(true)}>+ Assign task</Button>
          </div>
        )}
      />

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Tax & compliance deadlines</div>
      <div className="flex justify-end mb-2 wosha-no-print">
        <button onClick={() => window.print()} style={{ border: "1px solid " + C.border, color: C.ink }} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Printer size={13} /> Print filings</button>
      </div>
      <div style={{ background: "#fff", border: "1px solid " + C.border }} className="wosha-printable rounded-xl overflow-hidden mb-6">
        <div className="px-5 pt-5">
          <PrintHeader />
          <div style={{ color: C.ink }} className="text-sm font-bold mb-3">Tax & Compliance Filings</div>
        </div>
        {taxItems.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>Nothing tracked yet.</div>}
        {taxItems.map((t, i) => (
          <div key={t.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : "1px solid " + C.border }}>
            <div>
              <div style={{ color: C.ink }} className="text-sm font-semibold">{t.name}</div>
              <div style={{ color: C.textSoft }} className="text-xs">Due {new Date(t.due_date).toLocaleDateString()}</div>
            </div>
            {t.status === "Filed" ? (
              <span style={{ color: "#185FA5" }} className="text-xs font-semibold">Filed</span>
            ) : canEdit ? (
              <button onClick={() => fileTax(t.id)} className="text-xs font-semibold wosha-no-print" style={{ color: C.cyan }}>Mark filed</button>
            ) : (
              <span style={{ color: C.textSoft }} className="text-xs">Pending</span>
            )}
          </div>
        ))}
        <div className="px-5 pb-5"><PrintFooter /></div>
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Tasks</div>
      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl"><EmptyState icon={ListChecks} title="No tasks assigned" body="Assign one to get started." /></div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden">
          {tasks.map((t) => <TaskRow key={t.id} t={t} canReview={canEdit} load={load} />)}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleAssignTask}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Assign task</div>
          {templates.length > 0 && (
            <>
              <FieldLabel>Choose from templates</FieldLabel>
              <div className="mb-3">
                <CustomSelect value="" onChange={(v) => setTaskForm({ ...taskForm, title: v })} placeholder="Select a template (or type your own below)…" options={templates.map((t) => ({ value: t.name, label: t.name }))} />
              </div>
            </>
          )}
          <FieldLabel>Task</FieldLabel>
          <input required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Due date</FieldLabel>
          <div className="mb-4">
            <CustomDatePicker value={taskForm.dueDate} onChange={(v) => setTaskForm({ ...taskForm, dueDate: v })} />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={taxOpen} onClose={() => setTaxOpen(false)}>
        <form onSubmit={handleAddTax}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Add tax / compliance item</div>
          <FieldLabel>Name</FieldLabel>
          <input required value={taxForm.name} onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })} placeholder="e.g. VAT Return" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Due date</FieldLabel>
          <div className="mb-4">
            <CustomDatePicker value={taxForm.dueDate} onChange={(v) => setTaxForm({ ...taxForm, dueDate: v })} />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setTaxOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
