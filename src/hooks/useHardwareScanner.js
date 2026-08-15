import { useEffect, useRef } from "react";

// Real USB/Bluetooth barcode scanners (the ones bundled with most "POS machine"
// hardware kits) don't need drivers or browser permissions — to the operating
// system they're just a keyboard, "typing" the scanned code character by
// character in a few milliseconds, then an Enter. A person can't type that
// fast. This function tells the two apart using only timestamps, with no DOM
// dependency, so the actual detection logic can be tested without a browser.
export function createScanDetector({ onScan, maxGapMs = 50, minLength = 3 }) {
  let buffer = "";
  let lastTime = 0;
  return {
    // Call once per printable character with the time it was received.
    handleChar(char, time) {
      if (lastTime && time - lastTime > maxGapMs) buffer = ""; // gap too big — a person typing, not a scanner burst
      buffer += char;
      lastTime = time;
    },
    // Call when Enter is received. Returns true if it fired a scan.
    handleEnter(time) {
      const code = buffer;
      const gapOk = lastTime > 0 && time - lastTime <= maxGapMs;
      buffer = "";
      if (code.length >= minLength && gapOk) {
        onScan(code);
        return true;
      }
      return false;
    },
    reset() {
      buffer = "";
      lastTime = 0;
    },
  };
}

// Wires createScanDetector to real keydown events for as long as the calling
// page is mounted and `enabled` is true. Ignores keystrokes while a genuine
// text field (input/textarea/contentEditable) has focus, so it never corrupts
// a field the cashier is deliberately typing into — a hardware scan is meant
// to be used while browsing the product list, not mid-form-entry. If a scan
// does land while a field has focus (the cashier scanned without meaning to
// click away first), it's simply ignored rather than silently mangling that
// field's text.
export function useHardwareScanner(onScan, { enabled = true } = {}) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;
    const detector = createScanDetector({ onScan: (code) => onScanRef.current(code) });

    const isTypingField = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    };

    const handler = (e) => {
      if (isTypingField()) return;
      const now = performance.now();
      if (e.key === "Enter") {
        if (detector.handleEnter(now)) e.preventDefault();
        return;
      }
      if (e.key.length === 1) {
        detector.handleChar(e.key, now);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
}
