import React, { useState, useEffect } from "react";
import { Megaphone, Plus } from "lucide-react";
import { api } from "../api.js";
import { C } from "../App.jsx";
import FileDropzone from "../components/FileDropzone.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import { PageHeader, StatusPill, Button, Modal, FieldLabel, EmptyState, LoadingState } from "../components/ui.jsx";

const blank = { name: "", discountPercent: "", targetSegment: "All", mediaUrl: "", mediaType: "", expiresInDays: "14" };

export default function Marketing() {
  const [promos, setPromos] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    api.checkExpiredPromotionMedia().catch(() => {});
    return Promise.all([api.getPromotions(), api.getCategories("client_segment")]).then(([p, s]) => { setPromos(p); setSegments(s); }).finally(() => setLoading(false));
  };
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

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Marketing"
        subtitle={promos.length + " promotions"}
        action={<Button onClick={openAdd}><span className="flex items-center gap-1.5"><Plus size={16} />New promotion</span></Button>}
      />
      {promos.length === 0 ? (
        <div className="bg-white rounded-xl"><EmptyState icon={Megaphone} title="No promotions yet" body="Create one to start marketing to your customer segments." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden">
              {p.media_url && (
                (p.media_type || "").startsWith("video")
                  ? <video src={p.media_url} controls className="w-full" style={{ maxHeight: 140, objectFit: "cover" }} />
                  : <img src={p.media_url} alt="" className="w-full" style={{ maxHeight: 140, objectFit: "cover" }} />
              )}
              <div className="p-4">
                <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-sm font-semibold mb-1">{p.name}</div>
                <div style={{ color: C.textSoft }} className="text-xs mb-3">{p.discount_percent}% off · Target: {p.target_segment}{p.expires_in_days && p.expires_in_days !== "never" ? " · media expires in " + p.expires_in_days + "d" : ""}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusPill label={p.status} tone={p.status === "Active" ? "success" : "ink"} />
                  <button onClick={() => toggle(p.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>{p.status === "Active" ? "End" : "Reactivate"}</button>
                  <button onClick={() => openEdit(p)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>
                  <button onClick={() => remove(p.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">{editing ? "Edit promotion" : "New promotion"}</div>
          <FieldLabel>Name</FieldLabel>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Discount %</FieldLabel>
          <input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Target segment</FieldLabel>
          <div className="mb-3">
            <CustomSelect value={form.targetSegment} onChange={(v) => setForm({ ...form, targetSegment: v })} options={[{ value: "All", label: "All customers" }, ...segments.map((s) => ({ value: s.name, label: s.name }))]} />
          </div>
          <FieldLabel>Media expires in</FieldLabel>
          <div className="mb-3">
            <CustomSelect value={form.expiresInDays} onChange={(v) => setForm({ ...form, expiresInDays: v })} options={[
              { value: "7", label: "7 days" }, { value: "14", label: "14 days" }, { value: "30", label: "30 days" },
              { value: "60", label: "60 days" }, { value: "never", label: "Never" },
            ]} />
          </div>
          <FieldLabel>Poster image or video (optional, max 4MB)</FieldLabel>
          <div className="mb-4">
            <FileDropzone accept="image/*,video/*" maxSizeMb={4} label="Drop a poster image or short video here" onUploaded={(f) => setForm({ ...form, mediaUrl: f.url, mediaType: f.name?.match(/\.(mp4|mov|webm)$/i) ? "video" : "image" })} />
            {form.mediaUrl && <div style={{ color: "#185FA5" }} className="text-xs mt-1">Media attached — will show on the promo card.</div>}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
