import React, { useState, useRef } from "react";
import { api } from "../api.js";

const C = { cyan: "#2B6CF6", border: "#E4E7EC" };

// size in px, value = current photo URL, onChange(url) fires once the real upload finishes.
export default function AvatarUpload({ value, onChange, name, size = 88 }) {
  const [preview, setPreview] = useState(null); // local object URL, shown instantly while uploading
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl); // shows immediately, before the network upload even starts
    setBusy(true);
    try {
      const result = await api.uploadFile(file);
      onChange(result.url);
    } catch (err) {
      setError("Couldn't upload — try again.");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const displayUrl = preview || value;
  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={pick} className="relative rounded-full overflow-hidden shrink-0" style={{ width: size, height: size, background: C.cyan }}>
        {displayUrl ? (
          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center text-white font-bold" style={{ fontSize: size * 0.4 }}>{initial}</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold opacity-0 hover:opacity-100 transition-opacity" style={{ background: "rgba(11,27,51,0.55)" }}>
          {busy ? "Uploading…" : "Change"}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      {error && <div style={{ color: "#DC2626" }} className="text-xs">{error}</div>}
    </div>
  );
}
