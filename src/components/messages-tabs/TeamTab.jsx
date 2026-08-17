import React, { useState, useEffect } from "react";
import { api } from "../../api.js";
import { useBranch, C } from "../../App.jsx";
import FileDropzone from "../FileDropzone.jsx";
import MessageAttachment from "../MessageAttachment.jsx";
import { Paperclip } from "lucide-react";
import CustomSelect from "../CustomSelect.jsx";
import { Button } from "../ui.jsx";

const guessType = (name) => {
  if (/\.(png|jpe?g|gif|webp)$/i.test(name)) return "image";
  if (/\.(mp3|wav|ogg|m4a)$/i.test(name)) return "audio";
  if (/\.(mp4|mov|webm)$/i.test(name)) return "video";
  return "file";
};

// Original TeamChat.jsx, exactly — only the outer PageHeader was removed.
export default function TeamTab() {
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
      <div className="mb-4" style={{ maxWidth: 240 }}>
        <CustomSelect value={channel} onChange={setChannel} options={[{ value: "all", label: "All branches" }, ...locations.map((l) => ({ value: l.id, label: l.name }))]} />
      </div>
      <div className="flex flex-col" style={{ height: 480 }}>
        <div className="flex-1 bg-white rounded-2xl p-4 overflow-y-auto flex flex-col gap-3 mb-3">
          {messages.length === 0 && <div style={{ color: C.textSoft }} className="text-sm">No messages in this channel yet.</div>}
          {messages.map((m) => (
            <div key={m.id} style={{ background: "#F5F7FA" }} className="rounded-lg p-3 max-w-md">
              {m.text && <div style={{ color: C.ink }} className="text-sm">{m.text}</div>}
              <MessageAttachment message={m} onMarkDownloaded={(note) => markDownloaded(m.id, note)} />
              <div style={{ color: C.textSoft }} className="text-xs mt-1">{m.sender_name} · {new Date(m.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
        {showAttach && (
          <div className="mb-3">
            <FileDropzone accept="image/*,audio/*,video/*,.pdf,.doc,.docx" label="Drop an image, audio, video, or file to attach" onUploaded={(f) => setAttachment(f)} />
            {attachment && <div style={{ color: "#185FA5" }} className="text-xs mt-1">Attached: {attachment.name} — will send with your next message.</div>}
          </div>
        )}
        <div className="flex gap-2">
          {attachAllowed && <button onClick={() => setShowAttach((v) => !v)} style={{ border: "1px solid " + C.border }} className="px-3 rounded-lg text-sm flex items-center"><Paperclip size={15} /></button>}
          <input className="flex-1 border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <Button onClick={send}>Send</Button>
        </div>
      </div>
    </div>
  );
}
