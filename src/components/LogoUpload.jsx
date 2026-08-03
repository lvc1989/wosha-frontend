import React, { useState, useRef } from "react";
import { api } from "../api.js";

const C = { cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085" };

// size in px, value = current logo URL, onChange(url) fires once the real upload finishes.
export default function LogoUpload({ value, onChange, size = 96 }) {
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
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

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={pick}
        style={{ width: size, height: size, background: displayUrl ? "#fff" : "linear-gradient(135deg, #2B6CF6, #FFC93C)", border: `1px solid ${C.border}` }}
        className="relative rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
      >
        {displayUrl && <img src={displayUrl} alt="" className="w-full h-full object-contain p-1" />}
        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold opacity-0 hover:opacity-100 transition-opacity" style={{ background: "rgba(11,27,51,0.55)" }}>
          {busy ? "Uploading…" : "Change"}
        </span>
      </button>
      <div>
        <button type="button" onClick={pick} style={{ color: C.cyan }} className="text-sm font-semibold">{value ? "Change logo" : "Upload a logo"}</button>
        <div style={{ color: C.textSoft }} className="text-xs mt-0.5">Any image size or shape works — it's never cropped.</div>
        {error && <div style={{ color: "#DC2626" }} className="text-xs mt-1">{error}</div>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  );
}
