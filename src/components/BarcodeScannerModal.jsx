import React, { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { X, Camera } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626" };

// Restricting to the formats real product barcodes actually use — not scanning
// for QR codes, PDF417, Data Matrix, etc. on every single frame — is a real,
// documented way to improve both scan speed and accuracy, not just a formality.
// A reader searching for 17 possible formats on every frame is doing far more
// work, and is more prone to a false or missed read, than one searching for 7.
const PRODUCT_BARCODE_FORMATS = [
  BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.ITF,
];
const SCAN_HINTS = new Map([[DecodeHintType.POSSIBLE_FORMATS, PRODUCT_BARCODE_FORMATS]]);

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
      if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader(SCAN_HINTS);
      setCameraOn(true);
      const controls = await readerRef.current.decodeFromConstraints(
        // A higher requested resolution gives the decoder more actual pixels to
        // work with on a small, close-up barcode — most phone cameras support
        // this even if they don't default to it. "ideal" means the browser will
        // still gracefully fall back on a camera that can't do this.
        { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } },
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
      {/* max-h + overflow-y-auto is the actual fix for parts of this modal landing
          outside the visible screen on shorter phone viewports — without it, a
          tall modal (title + camera preview + instructions + manual-entry form)
          could exceed the available height with no way to reach what's cut off. */}
      <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
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
          <div style={{ color: C.textSoft }} className="text-xs mb-4">Hold steady, fill the frame with the barcode, and make sure it's in focus and well-lit — this reads standard product barcodes (EAN, UPC, Code 128/39) automatically.</div>
        )}

        <form onSubmit={submitManual}>
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Or type / scan with an external device</label>
          <div className="flex gap-2">
            <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="Barcode number" />
            <button type="submit" style={{ background: C.ink }} className="text-white text-sm font-semibold px-4 rounded-lg">Use</button>
          </div>
        </form>
      </div>
    </div>
  );
}
