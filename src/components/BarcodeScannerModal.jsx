import React, { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Camera } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626" };

// onDetected(code: string) is called once a barcode is read (camera) or submitted (manual).
export default function BarcodeScannerModal({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => stopCamera(), []);

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  };

  // Camera only starts when the person explicitly taps "Enable Camera" — never auto-requested
  // on mount, since silently prompting for camera permission on page load is unreliable (and
  // often auto-denied) on iOS/Android browsers.
  const enableCamera = async () => {
    setError("");
    try {
      if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
      setCameraOn(true);
      const controls = await readerRef.current.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current,
        (result) => {
          if (result) {
            stopCamera();
            setCameraOn(false);
            onDetected(result.getText());
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      setCameraOn(false);
      setError("Couldn't access the camera — check your browser's camera permission, or enter the code manually below.");
    }
  };

  const submitManual = (e) => {
    e.preventDefault();
    if (manualCode.trim()) onDetected(manualCode.trim());
  };

  const close = () => { stopCamera(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.6)" }}>
      <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div style={{ color: C.ink }} className="text-lg font-bold">Scan Barcode</div>
          <button onClick={close} style={{ color: C.textSoft }}><X size={18} /></button>
        </div>

        {!cameraOn && (
          <button onClick={enableCamera} style={{ background: C.cyan }} className="w-full text-white rounded-lg py-2.5 text-sm font-semibold mb-4 flex items-center justify-center gap-2"><Camera size={16} /> Enable Camera</button>
        )}
        {error && <div style={{ background: "#FEE2E2", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-4">{error}</div>}

        <video ref={videoRef} autoPlay playsInline muted style={{ display: cameraOn ? "block" : "none", background: "#000" }} className="w-full rounded-lg mb-4 aspect-video object-cover" />
        {cameraOn && (
          <div style={{ color: C.textSoft }} className="text-xs mb-4">Point the camera at the barcode — it'll be read automatically, on any phone or browser.</div>
        )}

        <form onSubmit={submitManual}>
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Or type / scan with an external device</label>
          <div className="flex gap-2">
            <input autoFocus value={manualCode} onChange={(e) => setManualCode(e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="Barcode number" />
            <button type="submit" style={{ background: C.ink }} className="text-white text-sm font-semibold px-4 rounded-lg">Use</button>
          </div>
        </form>
      </div>
    </div>
  );
}
