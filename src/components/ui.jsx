import React from "react";
import { C, displayFont, monoFont } from "../App.jsx";

// Semantic tints used across the whole app for status, so every page's badges,
// icon halos, and left-bars draw from the same small set of meanings instead of
// each page inventing its own color-to-meaning mapping.
export const TONES = {
  cyan: { bg: C.cyan, tint: "#E6F1FB", border: "#85B7EB", deep: "#185FA5" },
  amber: { bg: C.amber, tint: "#FAEEDA", border: "#EF9F27", deep: "#854F0B" },
  danger: { bg: C.danger, tint: "#FDE8E7", border: "#F09595", deep: "#A32D2D" },
  success: { bg: "#639922", tint: "#EAF3DE", border: "#97C459", deep: "#3B6D11" },
  ink: { bg: C.ink, tint: "#E4E9F0", border: "#B4B2A9", deep: C.ink },
};

// The navy hero band used at the top of every page — replaces the plain
// "<h1 className='text-xl font-bold'>" pattern that made every page feel like
// an unstyled form. Two soft floating circles give it depth without a gradient.
export function PageHeader({ title, subtitle, action }) {
  return (
    <div
      style={{ background: C.ink }}
      className="relative overflow-hidden rounded-2xl px-6 py-5 mb-6"
    >
      <div style={{ background: "rgba(43,108,246,0.18)" }} className="absolute -right-3 -top-8 w-36 h-36 rounded-full" />
      <div style={{ background: "rgba(255,201,60,0.12)" }} className="absolute right-16 -bottom-10 w-24 h-24 rounded-full" />
      <div className="relative flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 style={{ fontFamily: displayFont, color: "#fff" }} className="text-2xl font-bold tracking-tight leading-tight">{title}</h1>
          {subtitle && <div style={{ color: "rgba(255,255,255,0.65)" }} className="text-sm mt-0.5">{subtitle}</div>}
        </div>
        {action && <div className="relative">{action}</div>}
      </div>
    </div>
  );
}

// Icon badge with a soft halo behind it — the signature element carried across
// dashboard stats, list rows, and grid cards so every icon reads as intentional
// rather than a bare lucide glyph sitting on white.
export function IconBadge({ icon: Icon, tone = "cyan", size = 38 }) {
  const t = TONES[tone] || TONES.cyan;
  const solid = tone === "amber"; // amber badges use dark icon-on-amber for contrast, others use white-on-solid
  return (
    <div
      style={{ width: size, height: size, background: t.bg, borderRadius: size * 0.26 }}
      className="flex items-center justify-center flex-shrink-0"
    >
      <Icon size={Math.round(size * 0.5)} color={solid ? C.ink : "#fff"} strokeWidth={1.9} />
    </div>
  );
}

// Tinted stat card — replaces the old white-card-with-colored-top-border pattern.
// `tone="ink"` renders the solid navy variant used for the one "hero" stat per row.
export function StatCard({ label, value, icon: Icon, tone = "cyan" }) {
  const t = TONES[tone] || TONES.cyan;
  const isInk = tone === "ink";
  return (
    <div
      style={{
        background: isInk ? C.ink : t.tint,
        border: isInk ? "none" : `1.5px solid ${t.border}`,
      }}
      className="rounded-xl px-4 py-3.5"
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ color: isInk ? "rgba(255,255,255,0.7)" : t.deep }} className="text-xs font-medium">{label}</span>
        {Icon && <Icon size={16} color={isInk ? C.amber : t.deep} strokeWidth={1.9} />}
      </div>
      <div style={{ fontFamily: monoFont, color: isInk ? "#fff" : t.deep }} className="text-[22px] font-medium">{value}</div>
    </div>
  );
}

// Semantic pill for statuses — pulls from TONES so "amber" always means the same
// thing (pending/attention) everywhere it appears, instead of each page picking
// its own bg/fg pair.
export function StatusPill({ label, tone = "ink" }) {
  const t = TONES[tone] || TONES.ink;
  return (
    <span
      style={{ background: t.tint, color: t.deep }}
      className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
    >
      {label}
    </span>
  );
}

// A single row in a list, with a colored left-bar carrying status (matches the
// dashboard "Next up" pattern) and an optional icon badge.
export function ListRow({ icon: Icon, tone = "cyan", title, subtitle, trailing, onClick }) {
  const t = TONES[tone] || TONES.cyan;
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      style={{ borderLeft: `4px solid ${t.bg}` }}
      className={`w-full flex items-center gap-3 px-3.5 py-3 bg-white rounded-xl text-left ${onClick ? "hover:bg-black/[0.02]" : ""}`}
    >
      {Icon && <IconBadge icon={Icon} tone={tone} size={34} />}
      <div className="flex-1 min-w-0">
        <div style={{ color: C.ink }} className="text-sm font-medium truncate">{title}</div>
        {subtitle && <div style={{ color: C.textSoft }} className="text-xs truncate">{subtitle}</div>}
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </Wrapper>
  );
}

// Primary/secondary button — replaces one-off inline-styled <button> tags scattered
// across every page.
export function Button({ children, variant = "primary", onClick, type = "button", disabled, className = "" }) {
  const styles = {
    primary: { background: C.cyan, color: "#fff" },
    dark: { background: C.ink, color: "#fff" },
    ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.border}` },
    danger: { background: C.danger, color: "#fff" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={styles[variant]}
      className={`text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.5)" }} onClick={onClose}>
      <div
        style={{ background: "#fff" }}
        className={`w-full ${wide ? "max-w-lg" : "max-w-sm"} rounded-2xl p-6 max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function FieldLabel({ children }) {
  return <label style={{ color: C.textSoft }} className="text-xs font-semibold block mb-1">{children}</label>;
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      {Icon && <div style={{ background: TONES.cyan.tint }} className="w-12 h-12 rounded-full flex items-center justify-center mb-3"><Icon size={22} color={TONES.cyan.deep} strokeWidth={1.9} /></div>}
      <div style={{ fontFamily: displayFont, color: C.ink }} className="text-base font-medium mb-1">{title}</div>
      {body && <div style={{ color: C.textSoft }} className="text-sm max-w-xs mb-4">{body}</div>}
      {action}
    </div>
  );
}

// A 3-column grid of icon-over-label tiles for fast task-switching — the pattern
// most POS apps use for their home screen instead of (or alongside) a stat/list
// layout. `items` is [{ icon, label, onClick, tone }].
export function QuickActionGrid({ items }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((it) => {
        const t = TONES[it.tone] || TONES.cyan;
        return (
          <button
            key={it.label}
            onClick={it.onClick}
            className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl py-4 px-2 hover:bg-black/[0.02] active:scale-[0.97] transition"
          >
            <div style={{ background: t.tint }} className="w-10 h-10 rounded-xl flex items-center justify-center">
              <it.icon size={19} color={t.deep} strokeWidth={1.9} />
            </div>
            <span style={{ color: C.ink }} className="text-xs font-medium text-center leading-tight">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// An instructional hero card for genuinely multi-step workflows — a small pill
// tag, a headline, and a plain-language explanation of what's about to happen.
// Reserved for flows that actually need orienting (multi-supplier quotation,
// receiving), not slapped on every modal.
export function HeroCard({ tag, title, body, tone = "cyan" }) {
  const t = TONES[tone] || TONES.cyan;
  return (
    <div style={{ background: t.bg }} className="relative overflow-hidden rounded-2xl px-5 py-5 mb-4">
      <div style={{ background: "rgba(255,255,255,0.15)" }} className="absolute -right-4 -top-8 w-28 h-28 rounded-full" />
      <div className="relative">
        {tag && (
          <span style={{ background: "rgba(255,255,255,0.2)", color: tone === "amber" ? C.ink : "#fff" }} className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3">
            {tag}
          </span>
        )}
        <div style={{ fontFamily: displayFont, color: tone === "amber" ? C.ink : "#fff" }} className="text-lg font-bold mb-1.5">{title}</div>
        {body && <div style={{ color: tone === "amber" ? "rgba(11,27,51,0.7)" : "rgba(255,255,255,0.8)" }} className="text-sm leading-relaxed">{body}</div>}
      </div>
    </div>
  );
}

// The full-screen branded loading state shown while the app boots — blue background
// (customizable in Settings) with the business's own logo centered, or a plain "W"
// mark if no logo has been uploaded yet. `status` lets the boot sequence show real
// feedback ("still connecting…") instead of leaving a spinner with no explanation.
export function LoadingScreen({ backgroundColor = "#2B6CF6", logoUrl, businessName, status, onRetry }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: backgroundColor }}>
      {logoUrl ? (
        <img src={logoUrl} alt="" className="w-20 h-20 rounded-2xl object-contain mb-4" style={{ background: "#fff" }} />
      ) : (
        <div style={{ background: C.ink, color: C.amber }} className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-4xl mb-4">
          {(businessName || "Wosha").charAt(0).toUpperCase()}
        </div>
      )}
      {!onRetry && <div className="w-6 h-6 rounded-full border-[3px] mt-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.35)", borderTopColor: "#fff" }} />}
      {status && <div style={{ color: "rgba(255,255,255,0.85)" }} className="text-sm mt-5 max-w-xs text-center px-6">{status}</div>}
      {onRetry && (
        <button onClick={onRetry} style={{ background: "#fff", color: C.ink }} className="mt-5 text-sm font-semibold px-5 py-2 rounded-lg">
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center gap-2.5 py-8">
      <div style={{ borderColor: TONES.cyan.tint, borderTopColor: C.cyan }} className="w-4 h-4 rounded-full border-2 animate-spin" />
      <span style={{ color: C.textSoft }} className="text-sm">Loading…</span>
    </div>
  );
}

// An outlined input whose label sits directly on the border line (rather than
// stacked above it) — a more considered take on a labeled text field. Optional:
// existing pages keep FieldLabel + plain <input>, this is available for new or
// refreshed forms without forcing a migration.
export function NotchedField({ label, ...props }) {
  return (
    <div className="relative mb-3">
      <label
        style={{ color: C.textSoft, background: "#fff" }}
        className="absolute -top-2 left-3 px-1 text-xs font-medium z-10"
      >
        {label}
      </label>
      <input
        {...props}
        style={{ borderColor: C.border, ...(props.style || {}) }}
        className={"w-full border rounded-lg px-3 pt-3 pb-2 text-sm " + (props.className || "")}
      />
    </div>
  );
}
