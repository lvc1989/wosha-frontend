import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useBranch } from "../App.jsx";
import FileDropzone from "../components/FileDropzone.jsx";
import MessageAttachment from "../components/MessageAttachment.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", bg: "#F5F7FA" };

const guessType = (name) => {
  if (/\.(png|jpe?g|gif|webp)$/i.test(name)) return "image";
  if (/\.(mp3|wav|ogg|m4a)$/i.test(name)) return "audio";
  if (/\.(mp4|mov|webm)$/i.test(name)) return "video";
  return "file";
};

export default function TeamChat() {
  const { locations } = useBranch();
  const [channel, setChannel] = useState("all");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const [attachAllowed, setAttachAllowed] = useState(true);

  const load = () => api.getTeamMessages(channel).then(setMessages);
  useEffect(() => { load(); }, [channel]);
  useEffect(() => { api.checkAttachmentPermission("staff").then((r) => setAttachAllowed(r.allowed)); }, []);

  const send = async () => {
    if (!text.trim() && !attachment) return;
    await api.sendTeamMessage({
      channel, text,
      attachmentUrl: attachment?.url, attachmentName: attachment?.name,
      attachmentType: attachment ? guessType(attachment.name) : undefined,
    });
    setText(""); setAttachment(null); setShowAttach(false);
    load();
  };

  const markDownloaded = async (id, note) => { await api.markTeamDownloaded(id, note); load(); };

  return (
    <div>
      <h1 style={{ color: C.ink }} className="text-xl font-bold mb-4">Team Chat</h1>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setChannel("all")} style={{ background: channel === "all" ? C.cyan : "#fff", color: channel === "all" ? "#fff" : C.ink, border: `1px solid ${C.border}` }} className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0">All Branches</button>
        {locations.map((l) => (
          <button key={l.id} onClick={() => setChannel(l.id)} style={{ background: channel === l.id ? C.cyan : "#fff", color: channel === l.id ? "#fff" : C.ink, border: `1px solid ${C.border}` }} className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0">{l.name}</button>
        ))}
      </div>
      <div className="flex flex-col" style={{ height: 480 }}>
        <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="flex-1 rounded-xl p-4 overflow-y-auto flex flex-col gap-3 mb-3">
          {messages.length === 0 && <div style={{ color: C.textSoft }} className="text-sm">No messages in this channel yet.</div>}
          {messages.map((m) => (
            <div key={m.id} style={{ background: C.bg }} className="rounded-lg p-3 max-w-md">
              {m.text && <div style={{ color: C.ink }} className="text-sm">{m.text}</div>}
              <MessageAttachment message={m} onMarkDownloaded={(note) => markDownloaded(m.id, note)} />
              <div style={{ color: C.textSoft }} className="text-xs mt-1">{m.sender_name} · {new Date(m.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
        {showAttach && (
          <div className="mb-3">
            <FileDropzone accept="image/*,audio/*,video/*,.pdf,.doc,.docx" label="Drop an image, audio, video, or file to attach" onUploaded={(f) => setAttachment(f)} />
            {attachment && <div style={{ color: "#166534" }} className="text-xs mt-1">Attached: {attachment.name} — will send with your next message.</div>}
          </div>
        )}
        <div className="flex gap-2">
          {attachAllowed && <button onClick={() => setShowAttach((v) => !v)} style={{ border: `1px solid ${C.border}` }} className="px-3 rounded-lg text-sm">📎</button>}
          <input className="flex-1 border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button onClick={send} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 rounded-lg">Send</button>
        </div>
      </div>
    </div>
  );
}
