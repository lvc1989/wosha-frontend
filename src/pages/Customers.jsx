import React, { useState, useEffect, lazy, Suspense } from "react";
import { api } from "../api.js";
import { Car, Camera, Users, Plus } from "lucide-react";
import MultiSelectDropdown from "../components/MultiSelectDropdown.jsx";
import { useSearchParams } from "react-router-dom";
import { C } from "../App.jsx";
import { PageHeader, ListRow, StatusPill, Button, Modal, FieldLabel, EmptyState, LoadingState } from "../components/ui.jsx";

const BarcodeScannerModal = lazy(() => import("../components/BarcodeScannerModal.jsx"));

const blankForm = { name: "", phone: "", email: "", plate: "" };

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
  const [scannerOpen, setScannerOpen] = useState(false);

  const loadCustomers = (searchTerm) => api.searchCustomersPaged(searchTerm, 0).then(({ rows, total: t }) => { setCustomers(rows); setTotal(t); });
  const load = () => Promise.all([loadCustomers(search), api.getCustomFields("customer"), api.getCategories("client_segment")])
    .then(([, cf, seg]) => { setCustomFields(cf); setSegmentOptions(seg); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

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

  const openAdd = () => { setEditing(null); setForm(blankForm); setCustomValues({}); setSelectedSegments([]); setOpen(true); setScannerOpen(false); };
  const scanPlate = (code) => { setForm((f) => ({ ...f, plate: code })); setScannerOpen(false); };

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    api.getCustomer(editId).then((c) => openEdit(c)).catch(() => {});
  }, [searchParams]);

  const openEdit = (c) => {
    setEditing(c.id);
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "" });
    setCustomValues(c.custom_data || {});
    setSelectedSegments(c.segments || []);
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (editing) {
      await api.updateCustomer(editing, { ...form, customData: customValues, segments: selectedSegments });
    } else {
      const { plate, ...rest } = form;
      const name = rest.name?.trim() || (plate?.trim() ? "Customer — " + plate.trim().toUpperCase() : "New Customer");
      await api.addCustomer({ ...rest, name, customData: customValues, segments: selectedSegments, vehicle: plate?.trim() ? { plate: plate.trim() } : undefined });
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
      <PageHeader
        title="Customers"
        subtitle={total + " total"}
        action={<Button onClick={openAdd}><span className="flex items-center gap-1.5"><Plus size={16} />Add customer</span></Button>}
      />
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone…" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />

      {loading ? (
        <LoadingState />
      ) : (
        <>
        {customers.length === 0 ? (
          <div className="bg-white rounded-xl">
            <EmptyState icon={Users} title="No customers found" body="Try a different search, or add your first customer." action={<Button onClick={openAdd}>Add customer</Button>} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {customers.map((c) => (
              <ListRow
                key={c.id}
                icon={Users}
                tone="cyan"
                title={c.name}
                subtitle={
                  (c.phone || "") + (c.email ? " · " + c.email : "") +
                  ((c.vehicles || []).length > 0 ? " · " + c.vehicles.map((v) => v.plate).join(", ") : "")
                }
                trailing={
                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    {(c.segments || []).map((s) => <StatusPill key={s} label={s} tone="cyan" />)}
                    <button onClick={() => openAddVehicle(c)} className="text-xs font-semibold whitespace-nowrap" style={{ color: C.cyan }}>+ Vehicle</button>
                    <button onClick={() => openEdit(c)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>
                  </div>
                }
              />
            ))}
          </div>
        )}
        {customers.length < total && (
          <div className="text-center mt-3">
            <Button variant="ghost" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Load more (" + customers.length + " of " + total + ")"}
            </Button>
          </div>
        )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">{editing ? "Edit customer" : "Add customer"}</div>
          <FieldLabel>Full name (optional if scanning a plate)</FieldLabel>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Phone</FieldLabel>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Email (optional)</FieldLabel>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          {!editing && (
            <>
              <FieldLabel>Vehicle plate (optional)</FieldLabel>
              <div className="flex flex-wrap gap-2 mb-4">
                <input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="e.g. T 123 ABC" style={{ borderColor: C.border, minWidth: 160 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={() => setScannerOpen(true)} style={{ border: "1px solid " + C.border, color: C.ink }} className="px-3 rounded-lg flex items-center"><Camera size={15} /></button>
              </div>
            </>
          )}

          {customFields.map((f) => (
            <div key={f.id}>
              <FieldLabel>{f.field_name}</FieldLabel>
              <input value={customValues[f.field_name] || ""} onChange={(e) => setCustomValues({ ...customValues, [f.field_name]: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            </div>
          ))}

          <label className="text-xs font-semibold block mb-2" style={{ color: C.textSoft }}>Segments / Tags</label>
          <div className="mb-4">
            <MultiSelectDropdown
              value={selectedSegments}
              onChange={setSelectedSegments}
              options={segmentOptions.map((s) => ({ value: s.name, label: s.name }))}
              placeholder="None selected"
              emptyMessage="No segments defined yet — add some in Settings."
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!vehicleTarget} onClose={() => setVehicleTarget(null)}>
        {vehicleTarget && (
          <form onSubmit={submitVehicle}>
            <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Add vehicle — {vehicleTarget.name}</div>
            <FieldLabel>Plate number</FieldLabel>
            <input required value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })} placeholder="e.g. T 123 ABC" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <FieldLabel>Make</FieldLabel>
            <input value={vehicleForm.make} onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <FieldLabel>Model</FieldLabel>
            <input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <FieldLabel>Color</FieldLabel>
            <input value={vehicleForm.color} onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setVehicleTarget(null)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1">Add vehicle</Button>
            </div>
          </form>
        )}
      </Modal>

      {scannerOpen && <Suspense fallback={null}><BarcodeScannerModal onDetected={scanPlate} onClose={() => setScannerOpen(false)} /></Suspense>}
    </div>
  );
}
