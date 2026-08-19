import { useState, useEffect } from "react";

// Real, live screen-size detection — not just CSS breakpoints (which only
// control what's shown/hidden), but an actual value components can use to
// change what they DO: how many columns to render, whether to show a full
// label or just an icon, how wide to make a fixed-width control. Updates
// live if the window is resized or the device is rotated, not just read once.
export function useScreenSize() {
  const [width, setWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));

  useEffect(() => {
    let frame;
    const handler = () => {
      // rAF-throttled — a resize/rotate event can fire many times a second;
      // this coalesces bursts into one update per frame instead of re-rendering
      // every consumer on every single pixel change.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
      cancelAnimationFrame(frame);
    };
  }, []);

  return {
    width,
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}
