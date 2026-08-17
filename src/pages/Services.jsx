import React, { useState, useEffect } from "react";
import { Droplet, Sparkles, Package, Plus } from "lucide-react";
import { api } from "../api.js";
import { useUser, C } from "../App.jsx";
import { PageHeader, Button, Modal, FieldLabel, LoadingState } from "../components/ui.jsx";
import CustomSelect from "../components/CustomSelect.jsx";

const money = (n) => "TZS " + Number(n || 0).toLocaleString();
// Cycles through a small distinct-but-on-brand palette per category, same pattern
// used on the marketing site's service marquee.
const PALETTE = [
  { tint: "#E6F1FB", accent: "#2B6CF6", icon: Droplet },
  { tint: "#FAEEDA", accent: "#966B00", icon: Sparkles },
  { tint: "#E6F1FB", accent: "#2B6CF6", icon: Package },
];

export default function Services() {
  const { user } = useUser();
  const canEdit = user?.role === "owner" || user?.role === "manager";
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", category: "", price: "", durationMin: "30" });
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => Promise.all([api.getServices(), api.getCategories("service")]).then(([s, c]) => { setServices(s); setCategories(c); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", category: "", price: "", durationMin: "30" }); setOpen(true); };
  const openEdit = (s) => { setEditing(s.id); setForm({ name: s.name, category: s.category, price: s.price, durationMin: s.duration_min }); setOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { name: form.name, category: form.category, price: Number(form.price), durationMin: Number(form.durationMin) };
    if (editing) await api.updateService(editing, payload);
    else await api.addService(payload);
    setOpen(false);
    load();
  };

  if (loading) return <LoadingState />;

  const byCategory = services.reduce((acc, s) => { (acc[s.category] = acc[s.category] || []).push(s); return acc; }, {});
  const categoryList = Object.entries(byCategory);

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle={services.length + " active across your branches"}
        action={canEdit && <Button onClick={openAdd}><span className="flex items-center gap-1.5"><Plus size={16} />Add service</span></Button>}
      />

      {!canEdit && <div style={{ background: "#FAEEDA", color: "#854F0B" }} className="rounded-lg px-4 py-2 text-xs mb-4">Pricing is managed by branch managers and ownership. You have view-only access here.</div>}

      {categoryList.length === 0 && <div style={{ color: C.textSoft }} className="text-sm">No services yet — add your price list here.</div>}

      {categoryList.map(([category, items], ci) => {
        const style = PALETTE[ci % PALETTE.length];
        const Icon = style.icon;
        return (
          <div key={category} className="mb-8">
            <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-base font-semibold mb-3">{category}</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl p-4 relative overflow-hidden">
                  <div style={{ background: style.tint }} className="absolute -right-3 -top-3 w-16 h-16 rounded-full" />
                  <div style={{ background: style.accent }} className="w-9 h-9 rounded-lg flex items-center justify-center relative mb-3">
                    <Icon size={17} color="#fff" />
                  </div>
                  <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-sm font-semibold mb-1 relative">{s.name}</div>
                  <div style={{ color: C.textSoft }} className="text-xs mb-3 relative">{s.duration_min} min</div>
                  <div className="flex items-center justify-between relative">
                    <span style={{ color: style.accent, fontFamily: "'IBM Plex Mono', monospace" }} className="text-base font-medium">{money(s.price)}</span>
                    {canEdit && <button onClick={() => openEdit(s)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">{editing ? "Edit service" : "Add service"}</div>
          <FieldLabel>Name</FieldLabel>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
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
