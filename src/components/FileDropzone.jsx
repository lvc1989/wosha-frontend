import React, { useState, useRef } from "react";
import { api } from "../api.js";
import { Check } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626" };

// onUploaded({ url, name }) fires once the file is actually uploaded to the server.
export default function FileDropzone({ onUploaded, accept, label = "Drag a file here, or click to browse", maxSizeMb = 5 }) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastFileName, setLastFileName] = useState("");
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File is too large — max ${maxSizeMb}MB.`);
      return;
    }
    setBusy(true);
    try {
      const result = await api.uploadFile(file);
      setLastFileName(result.name);
      onUploaded(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        style={{ borderColor: dragOver ? C.cyan : C.border, background: dragOver ? "#E6F1FB" : "#fafbfc" }}
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        <div style={{ color: C.textSoft }} className="text-sm">{busy ? "Uploading…" : label}</div>
        {lastFileName && !busy && <div style={{ color: "#185FA5" }} className="text-xs mt-1 flex items-center gap-1"><Check size={12} /> {lastFileName}</div>}
      </div>
      {error && <div style={{ color: C.danger }} className="text-xs mt-2">{error}</div>}
    </div>
  );
}
