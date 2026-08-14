// Shared design tokens — deliberately a standalone module with NO imports of its
// own. Previously these lived inside App.jsx, and components/ui.jsx imported them
// from there — which created a real circular dependency: App.jsx eagerly imports
// Login.jsx, which imports ui.jsx, which imported back from App.jsx. Bundled
// together, that cycle could force ui.jsx's module-level code (which uses these
// tokens immediately, not deferred inside a function) to run before App.jsx had
// actually finished initializing them, throwing "Cannot access before
// initialization" — the exact crash that was happening. Moving the tokens here,
// with no dependency on either file, makes the cycle impossible rather than
// just less likely.
export const C = {
  ink: "#0B1B33", inkSoft: "#132A4D", bg: "#F5F7FA", card: "#FFFFFF",
  cyan: "#2B6CF6", cyanDeep: "#1745B3", amber: "#FFC93C", amberDeep: "#966B00",
  violet: "#1F2937", text: "#0F172A", textSoft: "#64748B", border: "#E4E9F0",
  danger: "#DC2626", successBg: "#E8F1FF", amberBg: "#FFF6DC", dangerBg: "#FDE8E7",
};
export const displayFont = "'Space Grotesk', 'Segoe UI', sans-serif";
export const bodyFont = "'Inter', 'Segoe UI', sans-serif";
export const monoFont = "'IBM Plex Mono', monospace";

// Small, dependency-free color math — used only to derive a lighter "tint" and
// a darker "deep" shade from a single color an owner picks in Settings, so a
// custom theme stays internally consistent (hover states, halos, borders) rather
// than mixing one new color with several now-mismatched old hardcoded shades.
function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  const c = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
export function lighten(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}
export function darken(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}
