import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { Car } from "lucide-react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085" };
const blankForm = { name: "", phone: "", email: "" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [customValues, setCustomValues] = useState({});
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [segmentOptions, setSegmentOptions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [vehicleTarget, setVehicleTarget] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({ plate: "", make: "", model: "", color: "" });

  const loadCustomers = (searchTerm) => api.searchCustomersPaged(searchTerm, 0).then(({ rows, total: t }) => { setCustomers(rows); setTotal(t); });
  const load = () => Promise.all([loadCustomers(search), api.getCustomFields("customer"), api.getCategories("client_segment")])
    .then(([, cf, seg]) => { setCustomFields(cf); setSegmentOptions(seg); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  // Debounced search — re-fetch from the server as the person types, rather than filtering
  // a full customer list that was already loaded (which defeats the point of pagination).
  useEffect(() => {
    const t = setTimeout(() => { setLoading(true); loadCustomers(search).finally(() => setLoading(false)); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadMore = async () => {
    setLoadingMore(true);
    const { rows } = await api.searchCustomersPaged(search, customers.length);
    setCustomers((prev) => [...prev, ...rows]);
    setLoadingMore(false);
  };

  const openAdd = () => { setEditing(null); setForm(blankForm); setCustomValues({}); setSelectedSegments([]); setOpen(true); };
  const openEdit = (c) => {
    setEditing(c.id);
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "" });
    setCustomValues(c.custom_data || {});
    setSelectedSegments(c.segments || []);
    setOpen(true);
  };

  const toggleSegment = (name) => setSelectedSegments((prev) => prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]);

  const submit = async (e) => {
    e.preventDefault();
    if (editing) {
      await api.updateCustomer(editing, { ...form, customData: customValues, segments: selectedSegments });
    } else {
      await api.addCustomer({ ...form, customData: customValues, segments: selectedSegments });
    }
    setOpen(false);
    load();
  };

  const openAddVehicle = (c) => { setVehicleTarget(c); setVehicleForm({ plate: "", make: "", model: "", color: "" }); };
  const submitVehicle = async (e) => {
    e.preventDefault();
    await api.addVehicle(vehicleTarget.id, vehicleForm);
    setVehicleTarget(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ color: C.ink }} className="text-xl font-bold">Customers</h1>
        <button onClick={openAdd} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Add Customer</button>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone…" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />

      {loading ? (
        <div style={{ color: C.textSoft }}>Loading…</div>
      ) : (
        <>
        <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl overflow-hidden">
          {customers.length === 0 && <div className="p-4 text-sm" style={{ color: C.textSoft }}>No customers found.</div>}
          {customers.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between gap-2 flex-wrap px-5 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
              <div>
                <div style={{ color: C.ink }} className="text-sm font-semibold">{c.name}</div>
                <div style={{ color: C.textSoft }} className="text-xs">{c.phone} {c.email ? `· ${c.email}` : ""}</div>
                {(c.vehicles || []).length > 0 && (
                  <div style={{ color: C.textSoft }} className="text-xs mt-0.5 flex items-center gap-1"><Car size={12} /> {c.vehicles.map((v) => v.plate).join(", ")}</div>
                )}
                {(c.segments || []).length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {c.segments.map((s) => <span key={s} style={{ background: "#EEF2FF", color: C.cyan }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full">{s}</span>)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span style={{ color: C.textSoft }} className="text-xs">{c.tag}</span>
                <button onClick={() => openAddVehicle(c)} className="text-xs font-semibold" style={{ color: C.cyan }}>+ Vehicle</button>
                <button onClick={() => openEdit(c)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
        {customers.length < total && (
          <div className="text-center mt-3">
            <button onClick={loadMore} disabled={loadingMore} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
              {loadingMore ? "Loading…" : `Load More (${customers.length} of ${total})`}
            </button>
          </div>
        )}
        </>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submit} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6 max-h-[85vh] overflow-y-auto">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">{editing ? "Edit Customer" : "Add Customer"}</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Full name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Email (optional)</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />

            {customFields.map((f) => (
              <div key={f.id}>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>{f.field_name}</label>
                <input value={customValues[f.field_name] || ""} onChange={(e) => setCustomValues({ ...customValues, [f.field_name]: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
              </div>
            ))}

            <label className="text-xs font-semibold block mb-2" style={{ color: C.textSoft }}>Segments / Tags</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {segmentOptions.map((s) => (
                <button key={s.id} type="button" onClick={() => toggleSegment(s.name)} style={{ background: selectedSegments.includes(s.name) ? C.cyan : "#fff", color: selectedSegments.includes(s.name) ? "#fff" : C.ink, border: `1px solid ${C.border}` }} className="text-xs font-semibold px-3 py-1.5 rounded-full">{s.name}</button>
              ))}
              {segmentOptions.length === 0 && <span style={{ color: C.textSoft }} className="text-xs">No segments defined yet — add some in Settings.</span>}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Save</button>
            </div>
          </form>
        </div>
      )}

      {vehicleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submitVehicle} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Add Vehicle — {vehicleTarget.name}</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Plate number</label>
            <input required value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })} placeholder="e.g. T 123 ABC" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Make</label>
            <input value={vehicleForm.make} onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Model</label>
            <input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Color</label>
            <input value={vehicleForm.color} onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setVehicleTarget(null)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Add Vehicle</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
