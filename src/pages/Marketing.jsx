import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import FileDropzone from "../components/FileDropzone.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", successBg: "#E6F4EA", danger: "#DC2626" };
const blank = { name: "", discountPercent: "", targetSegment: "All", mediaUrl: "", mediaType: "", expiresInDays: "14" };

export default function Marketing() {
  const [promos, setPromos] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => Promise.all([api.getPromotions(), api.getCategories("client_segment")]).then(([p, s]) => { setPromos(p); setSegments(s); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name, discountPercent: p.discount_percent, targetSegment: p.target_segment, mediaUrl: p.media_url || "", mediaType: p.media_type || "", expiresInDays: p.expires_in_days || "14" });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, discountPercent: Number(form.discountPercent) };
    if (editing) await api.updatePromotion(editing, payload);
    else await api.addPromotion(payload);
    setOpen(false);
    load();
  };
  const toggle = async (id) => { await api.togglePromotion(id); load(); };
  const remove = async (id) => { if (confirm("Delete this promotion?")) { await api.removePromotion(id); load(); } };

  if (loading) return <div style={{ color: C.textSoft }}>Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Marketing</h1>
        <button onClick={openAdd} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ New Promotion</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.length === 0 && <div className="text-sm" style={{ color: C.textSoft }}>No promotions yet.</div>}
        {promos.map((p) => (
          <div key={p.id} style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
            {p.media_url && (
              (p.media_type || "").startsWith("video")
                ? <video src={p.media_url} controls className="w-full" style={{ maxHeight: 140, objectFit: "cover" }} />
                : <img src={p.media_url} alt="" className="w-full" style={{ maxHeight: 140, objectFit: "cover" }} />
            )}
            <div className="p-4">
              <div style={{ color: C.ink }} className="text-sm font-semibold mb-1">{p.name}</div>
              <div style={{ color: C.textSoft }} className="text-xs mb-3">{p.discount_percent}% off · Target: {p.target_segment}{p.expires_in_days && p.expires_in_days !== "never" ? ` · media expires in ${p.expires_in_days}d` : ""}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ background: p.status === "Active" ? C.successBg : "#F1F2F4", color: p.status === "Active" ? "#166534" : "#667085" }} className="text-xs font-medium px-2.5 py-1 rounded-full">{p.status}</span>
                <button onClick={() => toggle(p.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>{p.status === "Active" ? "End" : "Reactivate"}</button>
                <button onClick={() => openEdit(p)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>
                <button onClick={() => remove(p.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6 max-h-[85vh] overflow-y-auto">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">{editing ? "Edit Promotion" : "New Promotion"}</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Discount %</label>
            <input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Target segment</label>
            <select value={form.targetSegment} onChange={(e) => setForm({ ...form, targetSegment: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              <option value="All">All customers</option>
              {segments.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Media expires in</label>
            <select value={form.expiresInDays} onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm">
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="never">Never</option>
            </select>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Poster image or video (optional, max 4MB)</label>
            <div className="mb-4">
              <FileDropzone accept="image/*,video/*" maxSizeMb={4} label="Drop a poster image or short video here" onUploaded={(f) => setForm({ ...form, mediaUrl: f.url, mediaType: f.name?.match(/\.(mp4|mov|webm)$/i) ? "video" : "image" })} />
              {form.mediaUrl && <div style={{ color: "#166534" }} className="text-xs mt-1">Media attached — will show on the promo card.</div>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
