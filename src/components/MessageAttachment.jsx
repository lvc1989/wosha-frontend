import React, { useState } from "react";
import { Check, Paperclip } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085" };

export default function MessageAttachment({ message, onMarkDownloaded }) {
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");

  if (message.downloaded) {
    return (
      <div style={{ color: "#166534" }} className="text-xs mt-1 flex items-center gap-1">
        <Check size={12} /> Downloaded{message.saved_location_note ? ` — saved to: ${message.saved_location_note}` : ""}
      </div>
    );
  }
  if (!message.attachment_url) return null;

  const type = message.attachment_type || "";
  const isImage = type.startsWith("image") || /\.(png|jpe?g|gif|webp)$/i.test(message.attachment_url);
  const isAudio = type.startsWith("audio") || /\.(mp3|wav|ogg|m4a)$/i.test(message.attachment_url);
  const isVideo = type.startsWith("video") || /\.(mp4|mov|webm)$/i.test(message.attachment_url);

  const startDownload = () => {
    // Trigger the actual browser download first
    const a = document.createElement("a");
    a.href = message.attachment_url;
    a.download = message.attachment_name || "attachment";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Then ask where it was saved — this is the honest, only-possible way to know,
    // since no browser lets a website see the real device file path.
    setAsking(true);
  };

  const confirmSaved = async () => {
    await onMarkDownloaded(note || "Not specified");
    setAsking(false);
    setNote("");
  };

  return (
    <div className="mt-2">
      {isImage && <img src={message.attachment_url} alt="" className="rounded-lg max-w-[220px] mb-1" />}
      {isAudio && <audio controls src={message.attachment_url} className="mb-1" style={{ maxWidth: 220 }} />}
      {isVideo && <video controls src={message.attachment_url} className="rounded-lg mb-1" style={{ maxWidth: 220 }} />}
      {!isImage && !isAudio && !isVideo && (
        <div style={{ color: C.textSoft }} className="text-xs mb-1 flex items-center gap-1"><Paperclip size={11} /> {message.attachment_name || "Attachment"}</div>
      )}
      {!asking ? (
        <button onClick={startDownload} style={{ color: C.cyan }} className="text-xs font-semibold underline">Download</button>
      ) : (
        <div style={{ background: "#F5F7FA", border: `1px solid ${C.border}` }} className="rounded-lg p-2 mt-1">
          <div style={{ color: C.ink }} className="text-xs font-medium mb-1">Where did you save it? (optional, for your own reference)</div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Downloads folder, Desktop" style={{ borderColor: C.border }} className="w-full border rounded px-2 py-1 text-xs mb-1" />
          <div className="flex gap-2">
            <button onClick={confirmSaved} style={{ background: C.cyan }} className="text-white text-xs font-semibold px-2 py-1 rounded">Confirm</button>
            <button onClick={() => confirmSaved()} style={{ color: C.textSoft }} className="text-xs">Skip</button>
          </div>
        </div>
      )}
    </div>
  );
}
