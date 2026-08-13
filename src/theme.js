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
