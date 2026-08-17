import React, { useState, useEffect } from "react";
import { Droplet, Sparkles, Package, Plus, Wind, Car, Wrench, SprayCan, Waves, ShowerHead, Brush, Gem, Fan, Sofa, X, Upload } from "lucide-react";
import { api } from "../api.js";
import { useUser, useBrand, C } from "../App.jsx";
import { PageHeader, Button, Modal, FieldLabel, LoadingState } from "../components/ui.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import { getIconSizePref } from "../theme.js";

const money = (n) => "TZS " + Number(n || 0).toLocaleString();

// Matches a service to a genuinely related icon based on keywords in its own
// name — "Interior Detailing" gets a seat, "Carpet Cleaning" gets a vacuum,
// "Engine Wash" gets a wrench — rather than one shared icon cycling by
// category regardless of what the service actually is. Falls back to a
// generic wash-drop icon for anything that doesn't match a known keyword.
const ICON_KEYWORDS = [
  [/carpet|upholstery/i, Sofa],
  [/interior|vacuum|seat/i, Wind],
  [/engine/i, Wrench],
  [/wax|polish|shine|detail/i, Sparkles],
  [/exterior|body|hand.?wash/i, Car],
  [/foam|spray/i, SprayCan],
  [/rinse|shower/i, ShowerHead],
  [/tyre|tire|rim|wheel/i, Fan],
  [/premium|deluxe|full/i, Gem],
  [/brush|scrub/i, Brush],
  [/wash/i, Waves],
];
const matchIcon = (name) => (ICON_KEYWORDS.find(([re]) => re.test(name || ""))?.[1]) || Droplet;

export default function Services() {
  const { user } = useUser();
  const { brand } = useBrand();
  const canEdit = user?.role === "owner" || user?.role === "manager";
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", category: "", price: "", durationMin: "30", iconUrl: "" });
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [iconPref, setIconPref] = useState(getIconSizePref);
  useEffect(() => {
    const handler = () => setIconPref(getIconSizePref());
    window.addEventListener("wosha-icon-size-change", handler);
    return () => window.removeEventListener("wosha-icon-size-change", handler);
  }, []);

  const load = () => Promise.all([api.getServices(), api.getCategories("service")]).then(([s, c]) => { setServices(s); setCategories(c); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", category: "", price: "", durationMin: "30", iconUrl: "" }); setOpen(true); };
  const openEdit = (s) => { setEditing(s.id); setForm({ name: s.name, category: s.category, price: s.price, durationMin: s.duration_min, iconUrl: s.icon_url || "" }); setOpen(true); };
  const removeService = async (id) => { if (confirm("Remove this service?")) { await api.removeService(id); load(); } };

  const handleIconUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadFile(file);
      setForm((f) => ({ ...f, iconUrl: url }));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { name: form.name, category: form.category, price: Number(form.price), durationMin: Number(form.durationMin), iconUrl: form.iconUrl };
    if (editing) await api.updateService(editing, payload);
    else await api.addService(payload);
    setOpen(false);
    load();
  };

  if (loading) return <LoadingState />;

  const byCategory = services.reduce((acc, s) => { (acc[s.category] = acc[s.category] || []).push(s); return acc; }, {});
  const categoryList = Object.entries(byCategory);
  const iconBg = brand?.menu_icon_bg_color || "#E6F1FB";
  const iconColor = brand?.menu_icon_color || "#185FA5";
  const cardCols = { 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" }[iconPref.cols] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  const iconBoxSize = { normal: "w-9 h-9", large: "w-11 h-11", xlarge: "w-14 h-14" }[iconPref.size] || "w-9 h-9";
  const iconGlyphSize = { normal: 17, large: 21, xlarge: 27 }[iconPref.size] || 17;

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle={services.length + " active across your branches"}
        action={canEdit && <Button onClick={openAdd}><span className="flex items-center gap-1.5"><Plus size={16} />Add service</span></Button>}
      />

      {!canEdit && <div style={{ background: "#FAEEDA", color: "#854F0B" }} className="rounded-lg px-4 py-2 text-xs mb-4">Pricing is managed by branch managers and ownership. You have view-only access here.</div>}

      {categoryList.length === 0 && <div style={{ color: C.textSoft }} className="text-sm">No services yet — add your price list here.</div>}

      {categoryList.map(([category, items]) => {
        return (
          <div key={category} className="mb-8">
            <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-base font-semibold mb-3">{category}</div>
            <div className={"grid gap-3 " + cardCols}>
              {items.map((s) => {
                const Icon = matchIcon(s.name);
                return (
                <div key={s.id} className="bg-white rounded-2xl p-4 relative overflow-hidden">
                  <div style={{ background: iconBg }} className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-60" />
                  <div style={{ background: iconBg }} className={`${iconBoxSize} rounded-lg flex items-center justify-center relative mb-3 overflow-hidden`}>
                    {s.icon_url ? <img src={s.icon_url} alt="" className="w-full h-full object-cover" /> : <Icon size={iconGlyphSize} color={iconColor} />}
                  </div>
                  <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-sm font-semibold mb-1 relative">{s.name}</div>
                  <div style={{ color: C.textSoft }} className="text-xs mb-3 relative">{s.duration_min} min</div>
                  <div className="flex items-center justify-between relative">
                    <span style={{ color: iconColor, fontFamily: "'IBM Plex Mono', monospace" }} className="text-base font-medium">{money(s.price)}</span>
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>
                        <button onClick={() => removeService(s.id)} style={{ color: C.danger }}><X size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">{editing ? "Edit service" : "Add service"}</div>
          <FieldLabel>Name</FieldLabel>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Icon</FieldLabel>
          <div className="flex items-center gap-3 mb-3">
            <div style={{ background: "#E6F1FB" }} className="w-11 h-11 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              {form.iconUrl ? <img src={form.iconUrl} alt="" className="w-full h-full object-cover" /> : React.createElement(matchIcon(form.name), { size: 21, color: "#185FA5" })}
            </div>
            <label className="flex-1">
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleIconUpload(e.target.files[0])} />
              <span style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-3 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"><Upload size={13} /> {uploading ? "Uploading…" : form.iconUrl ? "Change image" : "Upload custom image"}</span>
            </label>
            {form.iconUrl && <button type="button" onClick={() => setForm({ ...form, iconUrl: "" })} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>}
          </div>
          {!form.iconUrl && <div style={{ color: C.textSoft }} className="text-xs mb-3 -mt-2">Automatically matched to the service name above — upload an image to use your own instead.</div>}
          <FieldLabel>Category</FieldLabel>
          <div className="mb-3">
            <CustomSelect required value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={categories.map((c) => ({ value: c.name, label: c.name }))} />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <FieldLabel>Price (TZS)</FieldLabel>
              <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <FieldLabel>Duration (min)</FieldLabel>
              <input type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
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
