import React, { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { X, Camera, ScanLine } from "lucide-react";

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

// A plate reads as letters/numbers, not a barcode pattern — genuinely
// different technology (text recognition, not pattern decoding), so this
// cleans up common OCR noise (stray punctuation, lowercase, line breaks)
// rather than pretending it works identically to a barcode read.
const cleanPlateText = (raw) => raw.replace(/[^A-Za-z0-9\s]/g, "").replace(/\s+/g, " ").trim().toUpperCase();

// onDetected(code: string) is called once a barcode is read (camera) or submitted (manual).
// mode="barcode" (default) reads product barcodes exactly as before — zero
// change to that path. mode="plate" reads a vehicle plate via real on-device
// OCR instead; since text recognition takes real time and is genuinely less
// exact than a barcode read, the detected text is shown for confirmation
// rather than auto-submitted the instant something is read.
export default function BarcodeScannerModal({ onDetected, onClose, mode = "barcode" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const ocrWorkerRef = useRef(null);
  const ocrTimerRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrCandidate, setOcrCandidate] = useState("");
  const ocrCandidateRef = useRef("");
  const isPlate = mode === "plate";

  useEffect(() => () => stopCamera(), []);

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (ocrTimerRef.current) { clearTimeout(ocrTimerRef.current); ocrTimerRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ocrWorkerRef.current) { ocrWorkerRef.current.terminate(); ocrWorkerRef.current = null; }
  };

  // Camera only starts when the person explicitly taps "Enable Camera" — never auto-requested
  // on mount, since silently prompting for camera permission on page load is unreliable (and
  // often auto-denied) on iOS/Android browsers.
  const enableCamera = async () => {
    setError("");
    if (isPlate) return enablePlateCamera();
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

  const enablePlateCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraOn(true);
      const { createWorker } = await import("tesseract.js");
      ocrWorkerRef.current = await createWorker("eng");
      runOcrLoop();
    } catch (err) {
      setCameraOn(false);
      setError("Couldn't access the camera — check your browser's camera permission, or enter the plate manually below.");
    }
  };

  // OCR works against a captured still frame, not a continuous stream like the
  // barcode path — so this captures one frame, reads it, waits, and repeats
  // for as long as the camera stays on and nothing's been confirmed yet.
  const runOcrLoop = async () => {
    if (!ocrWorkerRef.current || !videoRef.current || ocrCandidateRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0) { ocrTimerRef.current = setTimeout(runOcrLoop, 400); return; }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setOcrBusy(true);
    try {
      const { data } = await ocrWorkerRef.current.recognize(canvas);
      const cleaned = cleanPlateText(data.text || "");
      // A real plate has at least a few characters — ignores empty/noise reads
      // rather than showing a confirmation box for nothing.
      if (cleaned.length >= 4) { ocrCandidateRef.current = cleaned; setOcrCandidate(cleaned); }
    } catch (err) {
      // A single failed OCR pass isn't worth surfacing as an error — it just
      // tries again on the next frame.
    }
    setOcrBusy(false);
    if (!ocrCandidateRef.current) ocrTimerRef.current = setTimeout(runOcrLoop, 1200);
  };

  const confirmPlate = () => {
    stopCamera();
    setCameraOn(false);
    onDetected(ocrCandidate);
  };
  const retryPlate = () => { ocrCandidateRef.current = ""; setOcrCandidate(""); runOcrLoop(); };

  const submitManual = (e) => {
    e.preventDefault();
    if (manualCode.trim()) onDetected(isPlate ? cleanPlateText(manualCode) : manualCode.trim());
  };

  const close = () => { stopCamera(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* max-h + overflow-y-auto is the actual fix for parts of this modal landing
          outside the visible screen on shorter phone viewports — without it, a
          tall modal (title + camera preview + instructions + manual-entry form)
          could exceed the available height with no way to reach what's cut off. */}
      <div style={{ background: "#fff", boxShadow: "0 12px 40px rgba(11,27,51,0.25)" }} className="w-full max-w-sm rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div style={{ color: C.ink }} className="text-lg font-bold">{isPlate ? "Scan Plate Number" : "Scan Barcode"}</div>
          <button onClick={close} style={{ color: C.textSoft }}><X size={18} /></button>
        </div>

        {!cameraOn && (
          <button onClick={enableCamera} style={{ background: C.cyan }} className="w-full text-white rounded-lg py-2.5 text-sm font-semibold mb-4 flex items-center justify-center gap-2"><Camera size={16} /> Enable Camera</button>
        )}
        {error && <div style={{ background: "#FEE2E2", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mb-4">{error}</div>}

        <video ref={videoRef} autoPlay playsInline muted style={{ display: cameraOn ? "block" : "none", background: "#000" }} className="w-full rounded-lg mb-4 aspect-video object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {cameraOn && !isPlate && (
          <div style={{ color: C.textSoft }} className="text-xs mb-4">Hold steady, fill the frame with the barcode, and make sure it's in focus and well-lit — this reads standard product barcodes (EAN, UPC, Code 128/39) automatically.</div>
        )}
        {cameraOn && isPlate && !ocrCandidate && (
          <div style={{ color: C.textSoft }} className="text-xs mb-4 flex items-center gap-1.5">
            <ScanLine size={13} className={ocrBusy ? "animate-pulse" : ""} />
            {ocrBusy ? "Reading the plate…" : "Hold steady and keep the plate well-lit and centered — this reads real text, so it can take a moment and won't always get it perfectly on the first try."}
          </div>
        )}
        {cameraOn && isPlate && ocrCandidate && (
          <div style={{ background: "#F5F7FA" }} className="rounded-lg p-3 mb-4">
            <div style={{ color: C.textSoft }} className="text-xs mb-1">Does this look right? Edit it if not, then confirm.</div>
            <input value={ocrCandidate} onChange={(e) => setOcrCandidate(e.target.value.toUpperCase())} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-2 text-sm font-semibold" />
            <div className="flex gap-2">
              <button type="button" onClick={retryPlate} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="flex-1 text-xs font-semibold py-2 rounded-lg">Try again</button>
              <button type="button" onClick={confirmPlate} style={{ background: C.cyan }} className="flex-1 text-white text-xs font-semibold py-2 rounded-lg">Use this</button>
            </div>
          </div>
        )}

        <form onSubmit={submitManual}>
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Or type / scan with an external device</label>
          <div className="flex gap-2">
            <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder={isPlate ? "Plate number" : "Barcode number"} />
            <button type="submit" style={{ background: C.ink }} className="text-white text-sm font-semibold px-4 rounded-lg">Use</button>
          </div>
        </form>
      </div>
    </div>
  );
}
