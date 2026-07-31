import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { whatsappLink } from "../whatsapp.js";
import FileDropzone from "../components/FileDropzone.jsx";
import MessageAttachment from "../components/MessageAttachment.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", bg: "#F5F7FA", danger: "#DC2626" };

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

  const openThread = async (cust) => {
    setSelected(cust);
    setMessages(await api.getClientMessages(cust.id));
    const perm = await api.checkAttachmentPermission("client", cust.id);
    setAttachAllowed(perm.allowed);
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
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
          {customers.map((c, i) => (
            <button key={c.id} onClick={() => openThread(c)} style={{ background: selected?.id === c.id ? "#EEF2FF" : "transparent", borderTop: i === 0 ? "none" : `1px solid ${C.border}` }} className="w-full text-left px-4 py-3 flex items-center justify-between">
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
                <a href={whatsappLink(selected.phone, text || `Hi ${selected.name}, `)} target="_blank" rel="noreferrer" style={{ background: "#25D366" }} className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg">WhatsApp</a>
              )}
            </div>
            <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="flex-1 rounded-xl p-4 overflow-y-auto flex flex-col gap-3 mb-3">
              {messages.map((m) => (
                <div key={m.id} style={{ background: m.sender === "staff" ? "#EEF2FF" : C.bg, alignSelf: m.sender === "staff" ? "flex-end" : "flex-start" }} className="rounded-lg p-3 max-w-md">
                  {m.text && <div style={{ color: C.ink }} className="text-sm">{m.text}</div>}
                  <MessageAttachment message={m} onMarkDownloaded={(note) => markDownloaded(m.id, note)} />
                  <div style={{ color: C.textSoft }} className="text-xs mt-1">{m.sender === "staff" ? "You" : selected.name} · {new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
            {showAttach && (
              <div className="mb-3">
                <FileDropzone accept="image/*,audio/*,video/*,.pdf,.doc,.docx" label="Drop an image, audio, video, or file to attach" onUploaded={(f) => setAttachment(f)} />
                {attachment && <div style={{ color: "#166534" }} className="text-xs mt-1">Attached: {attachment.name}</div>}
              </div>
            )}
            <div className="flex gap-2">
              {attachAllowed && <button onClick={() => setShowAttach((v) => !v)} style={{ border: `1px solid ${C.border}` }} className="px-3 rounded-lg text-sm">📎</button>}
              <input className="flex-1 border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
              <button onClick={send} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 rounded-lg">Send</button>
            </div>
          </>
        )}
      </div>
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
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-5 mb-4 max-w-lg">
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Segment</label>
        <select value={segment} onChange={(e) => setSegment(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
          {segments.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <div style={{ color: C.textSoft }} className="text-xs mb-3">{members.length} customer(s) in this segment.</div>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Message</label>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
        <button onClick={sendToGroup} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">Log to All in Group</button>
        {result && <div style={{ color: "#166534" }} className="text-xs mt-2">Logged to {result.count} customer thread(s).</div>}
      </div>

      <div style={{ color: C.ink }} className="text-sm font-semibold mb-2">Members — send via WhatsApp or SMS individually</div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
        {members.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No customers in this segment yet.</div>}
        {members.map((c, i) => (
          <div key={c.id} className="flex items-center justify-between gap-2 flex-wrap px-4 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">{c.name} <span style={{ color: C.textSoft }} className="text-xs">{c.phone}</span></span>
            {c.phone && (
              <div className="flex gap-2">
                <a href={whatsappLink(c.phone, text)} target="_blank" rel="noreferrer" style={{ background: "#25D366" }} className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg">WhatsApp</a>
                <a href={`sms:${c.phone}?body=${encodeURIComponent(text)}`} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-3 py-1.5 rounded-lg">SMS</a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClientMessages() {
  const [mode, setMode] = useState("individual");
  const [customers, setCustomers] = useState([]);
  const [unread, setUnread] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadList = () => Promise.all([api.getCustomers(), api.getClientUnread()]).then(([c, u]) => { setCustomers(c); setUnread(u); }).finally(() => setLoading(false));
  useEffect(() => { loadList(); }, []);

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <h1 style={{ color: C.ink }} className="text-xl font-bold mb-4">Client Messages</h1>
      <div className="flex rounded-lg overflow-hidden mb-6" style={{ border: `1px solid ${C.border}`, width: "fit-content" }}>
        <button onClick={() => setMode("individual")} style={{ background: mode === "individual" ? C.cyan : "#fff", color: mode === "individual" ? "#fff" : C.ink }} className="px-4 py-2 text-sm font-semibold">Individual</button>
        <button onClick={() => setMode("groups")} style={{ background: mode === "groups" ? C.cyan : "#fff", color: mode === "groups" ? "#fff" : C.ink }} className="px-4 py-2 text-sm font-semibold">Groups & Bulk Messages</button>
      </div>
      {mode === "individual" ? <IndividualPanel customers={customers} unread={unread} reload={loadList} /> : <GroupsPanel customers={customers} />}
    </div>
  );
}
