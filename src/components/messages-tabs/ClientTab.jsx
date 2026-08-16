import React, { useState, useEffect } from "react";
import { api } from "../../api.js";
import { whatsappLink } from "../../whatsapp.js";
import FileDropzone from "../FileDropzone.jsx";
import MessageAttachment from "../MessageAttachment.jsx";
import CustomSelect from "../CustomSelect.jsx";
import { Paperclip, X } from "lucide-react";
import { C } from "../../App.jsx";
import { Button, LoadingState, Modal, FieldLabel } from "../ui.jsx";

const guessType = (name) => {
  if (/\.(png|jpe?g|gif|webp)$/i.test(name)) return "image";
  if (/\.(mp3|wav|ogg|m4a)$/i.test(name)) return "audio";
  if (/\.(mp4|mov|webm)$/i.test(name)) return "video";
  return "file";
};

function IndividualPanel({ customers, unread, reload }) {
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const [attachAllowed, setAttachAllowed] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", body: "" });

  const reloadTemplates = () => api.getMessageTemplates().then(setTemplates);
  useEffect(() => { reloadTemplates(); }, []);

  const addTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.name.trim() || !newTemplate.body.trim()) return;
    await api.addMessageTemplate(newTemplate);
    setNewTemplate({ name: "", body: "" });
    reloadTemplates();
  };
  const removeTemplate = async (id) => { await api.removeMessageTemplate(id); reloadTemplates(); };

  const openThread = async (cust) => {
    setSelected(cust);
    setMessages(await api.getClientMessages(cust.id));
    const perm = await api.checkAttachmentPermission("client", cust.id);
    setAttachAllowed(perm.allowed);
  };

  const useTemplate = async (tpl) => {
    if (!selected) return;
    const body = tpl.body.replace("{name}", selected.name);
    await api.sendClientMessage(selected.id, { text: body, sender: "staff" });
    setMessages(await api.getClientMessages(selected.id));
    reload();
  };

  const send = async () => {
    if ((!text.trim() && !attachment) || !selected) return;
    await api.sendClientMessage(selected.id, {
      text, sender: "staff",
      attachmentUrl: attachment?.url, attachmentName: attachment?.name,
      attachmentType: attachment ? guessType(attachment.name) : undefined,
    });
    setText(""); setAttachment(null); setShowAttach(false);
    setMessages(await api.getClientMessages(selected.id));
    reload();
  };

  const markDownloaded = async (id, note) => { await api.markClientDownloaded(id, note); setMessages(await api.getClientMessages(selected.id)); };
  const hasUnread = (id) => unread.some((u) => u.customer_id === id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
          {customers.map((c, i) => (
            <button key={c.id} onClick={() => openThread(c)} style={{ background: selected?.id === c.id ? "#E6F1FB" : "transparent", borderTop: i === 0 ? "none" : "1px solid " + C.border }} className="w-full text-left px-4 py-3 flex items-center justify-between">
              <span style={{ color: C.ink }} className="text-sm font-medium">{c.name}</span>
              {hasUnread(c.id) && <span style={{ background: C.danger }} className="w-2 h-2 rounded-full" />}
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2 flex flex-col" style={{ height: 480 }}>
        {!selected ? (
          <div style={{ color: C.textSoft }} className="text-sm">Select a customer to view the conversation.</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div style={{ color: C.ink }} className="text-sm font-semibold">{selected.name}</div>
              {selected.phone && (
                <a href={whatsappLink(selected.phone, text || "Hi " + selected.name + ", ")} target="_blank" rel="noreferrer" style={{ background: "#25D366" }} className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg">WhatsApp</a>
              )}
            </div>
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: C.textSoft }} className="text-xs font-semibold uppercase">Quick templates</span>
              <button onClick={() => setManageOpen(true)} className="text-xs font-semibold" style={{ color: C.cyan }}>Manage</button>
            </div>
            {templates.length > 0 && (
              <div className="flex flex-col gap-1 mb-3">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="flex items-center justify-between gap-2 flex-wrap px-3 py-1.5 rounded-lg" style={{ background: "#F5F7FA" }}>
                    <span style={{ color: C.ink }} className="text-xs font-medium">{tpl.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => useTemplate(tpl)} style={{ border: "1px solid " + C.border, color: C.ink }} className="text-xs font-semibold px-2.5 py-1 rounded-lg">Log</button>
                      {selected.phone && (
                        <a href={whatsappLink(selected.phone, tpl.body.replace("{name}", selected.name))} target="_blank" rel="noreferrer" style={{ background: "#25D366" }} className="text-white text-xs font-semibold px-2.5 py-1 rounded-lg">WhatsApp</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1 bg-white rounded-2xl p-4 overflow-y-auto flex flex-col gap-3 mb-3">
              {messages.map((m) => (
                <div key={m.id} style={{ background: m.sender === "staff" ? "#E6F1FB" : "#F5F7FA", alignSelf: m.sender === "staff" ? "flex-end" : "flex-start" }} className="rounded-lg p-3 max-w-md">
                  {m.text && <div style={{ color: C.ink }} className="text-sm">{m.text}</div>}
                  <MessageAttachment message={m} onMarkDownloaded={(note) => markDownloaded(m.id, note)} />
                  <div style={{ color: C.textSoft }} className="text-xs mt-1">{m.sender === "staff" ? "You" : selected.name} · {new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
            {showAttach && (
              <div className="mb-3">
                <FileDropzone accept="image/*,audio/*,video/*,.pdf,.doc,.docx" label="Drop an image, audio, video, or file to attach" onUploaded={(f) => setAttachment(f)} />
                {attachment && <div style={{ color: "#185FA5" }} className="text-xs mt-1">Attached: {attachment.name}</div>}
              </div>
            )}
            <div className="flex gap-2">
              {attachAllowed && <button onClick={() => setShowAttach((v) => !v)} style={{ border: "1px solid " + C.border }} className="px-3 rounded-lg text-sm flex items-center"><Paperclip size={15} /></button>}
              <input className="flex-1 border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
              <Button onClick={send}>Send</Button>
            </div>
          </>
        )}
      </div>

      <Modal open={manageOpen} onClose={() => setManageOpen(false)}>
        <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Manage message templates</div>
        <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto">
          {templates.length === 0 && <div style={{ color: C.textSoft }} className="text-xs">No templates yet — add one below.</div>}
          {templates.map((tpl) => (
            <div key={tpl.id} style={{ background: "#F5F7FA" }} className="rounded-lg px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span style={{ color: C.ink }} className="text-xs font-semibold">{tpl.name}</span>
                <button onClick={() => removeTemplate(tpl.id)} style={{ color: C.amberDeep }}><X size={13} /></button>
              </div>
              <div style={{ color: C.textSoft }} className="text-xs mt-0.5">{tpl.body}</div>
            </div>
          ))}
        </div>
        <form onSubmit={addTemplate} style={{ borderTop: "1px solid " + C.border }} className="pt-4">
          <FieldLabel>Template name</FieldLabel>
          <input value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="e.g. Booking reminder" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Message ({"{name}"} is replaced with the customer's name)</FieldLabel>
          <textarea rows={3} value={newTemplate.body} onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })} placeholder="Hi {name}, just a reminder about your booking…" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setManageOpen(false)} className="flex-1">Close</Button>
            <Button type="submit" className="flex-1">Add template</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function GroupsPanel({ customers }) {
  const [segments, setSegments] = useState([]);
  const [segment, setSegment] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => { api.getCategories("client_segment").then((s) => { setSegments(s); if (s.length) setSegment(s[0].name); }); }, []);

  const members = customers.filter((c) => (c.segments || []).includes(segment));

  const sendToGroup = async () => {
    if (!text.trim() || !segment) return;
    const res = await api.sendBulkClientMessage(segment, text);
    setResult(res);
  };

  return (
    <div>
      <div className="bg-white rounded-2xl p-5 mb-4 max-w-lg">
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Segment</label>
        <div className="mb-3">
          <CustomSelect value={segment} onChange={setSegment} options={segments.map((s) => ({ value: s.name, label: s.name }))} />
        </div>
        <div style={{ color: C.textSoft }} className="text-xs mb-3">{members.length} customer(s) in this segment.</div>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Message</label>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
        <Button onClick={sendToGroup}>Log to all in group</Button>
        {result && <div style={{ color: "#185FA5" }} className="text-xs mt-2">Logged to {result.count} customer thread(s).</div>}
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Members — send via WhatsApp or SMS individually</div>
      <div className="bg-white rounded-2xl overflow-hidden">
        {members.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No customers in this segment yet.</div>}
        {members.map((c, i) => (
          <div key={c.id} className="flex items-center justify-between gap-2 flex-wrap px-4 py-3" style={{ borderTop: i === 0 ? "none" : "1px solid " + C.border }}>
            <span style={{ color: C.ink }} className="text-sm">{c.name} <span style={{ color: C.textSoft }} className="text-xs">{c.phone}</span></span>
            {c.phone && (
              <div className="flex gap-2">
                <a href={whatsappLink(c.phone, text)} target="_blank" rel="noreferrer" style={{ background: "#25D366" }} className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg">WhatsApp</a>
                <a href={"sms:" + c.phone + "?body=" + encodeURIComponent(text)} style={{ border: "1px solid " + C.border, color: C.ink }} className="text-xs font-semibold px-3 py-1.5 rounded-lg">SMS</a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Original ClientMessages.jsx, exactly — only the outer PageHeader was removed.
// Its own internal Individual/Groups toggle is untouched.
export default function ClientTab() {
  const [mode, setMode] = useState("individual");
  const [customers, setCustomers] = useState([]);
  const [unread, setUnread] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadList = () => Promise.all([api.getCustomers(), api.getClientUnread()]).then(([c, u]) => { setCustomers(c); setUnread(u); }).finally(() => setLoading(false));
  useEffect(() => { loadList(); }, []);

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex rounded-lg overflow-hidden mb-6" style={{ border: "1px solid " + C.border, width: "fit-content" }}>
        <button onClick={() => setMode("individual")} style={{ background: mode === "individual" ? C.cyan : "#fff", color: mode === "individual" ? "#fff" : C.ink }} className="px-4 py-2 text-sm font-semibold">Individual</button>
        <button onClick={() => setMode("groups")} style={{ background: mode === "groups" ? C.cyan : "#fff", color: mode === "groups" ? "#fff" : C.ink }} className="px-4 py-2 text-sm font-semibold">Groups & bulk messages</button>
      </div>
      {mode === "individual" ? <IndividualPanel customers={customers} unread={unread} reload={loadList} /> : <GroupsPanel customers={customers} />}
    </div>
  );
}
