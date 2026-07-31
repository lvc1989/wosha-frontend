import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { useUser } from "../App.jsx";
import FileDropzone from "../components/FileDropzone.jsx";
import CategoryManager from "../components/CategoryManager.jsx";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", border: "#E4E7EC", textSoft: "#667085", danger: "#DC2626" };

export default function Settings() {
  const { user } = useUser();
  const [settings, setSettings] = useState(null);
  const [printers, setPrinters] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [notifPrefs, setNotifPrefs] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [staffOverrides, setStaffOverrides] = useState([]);
  const [clientOverrides, setClientOverrides] = useState([]);
  const [staffOverridePick, setStaffOverridePick] = useState("");
  const [staffOverrideAllow, setStaffOverrideAllow] = useState(true);
  const [clientOverridePick, setClientOverridePick] = useState("");
  const [clientOverrideAllow, setClientOverrideAllow] = useState(true);
  const [generalManagers, setGeneralManagers] = useState([]);
  const [gmForm, setGmForm] = useState({ name: "", username: "", password: "", email: "", phone: "" });
  const [gmOpen, setGmOpen] = useState(false);
  const [gmError, setGmError] = useState("");
  const [printerForm, setPrinterForm] = useState({ name: "", type: "Thermal", paperSize: "80mm" });
  const [poCategories, setPoCategories] = useState([]);
  const [poCatalog, setPoCatalog] = useState([]);
  const [catalogForm, setCatalogForm] = useState({ category: "", name: "", spec: "" });

  const load = () => Promise.all([api.getSettings(), api.getPrinterProfiles(), api.getCustomFields("customer"), api.getNotificationPrefs(), api.getCategories("purchase_order"), api.getPOCatalog(), api.getStaff(), api.getCustomers(), api.getAttachmentOverrides("staff"), api.getAttachmentOverrides("client")])
    .then(([s, p, cf, np, poc, cat, st, cust, so, co]) => { setSettings(s); setPrinters(p); setCustomFields(cf); setNotifPrefs(np); setPoCategories(poc); setPoCatalog(cat); setStaffList(st); setCustomerList(cust); setStaffOverrides(so); setClientOverrides(co); });
  useEffect(() => { load(); }, []);
  useEffect(() => { if (user?.isPrimaryOwner) api.getGeneralManagers().then(setGeneralManagers); }, [user]);

  const addGm = async (e) => {
    e.preventDefault();
    setGmError("");
    try {
      await api.addGeneralManager(gmForm);
      setGmForm({ name: "", username: "", password: "", email: "", phone: "" });
      setGmOpen(false);
      api.getGeneralManagers().then(setGeneralManagers);
    } catch (err) {
      setGmError(err.message);
    }
  };
  const deactivateGm = async (id) => { await api.deactivateGeneralManager(id); api.getGeneralManagers().then(setGeneralManagers); };
  const reactivateGm = async (id) => { await api.reactivateGeneralManager(id); api.getGeneralManagers().then(setGeneralManagers); };
  const removeGm = async (id) => { if (confirm("Permanently remove this General Manager account?")) { await api.removeGeneralManager(id); api.getGeneralManagers().then(setGeneralManagers); } };

  const toggleGlobalAttachments = async (field, value) => { await api.updateSettings({ [field]: value }); load(); };
  const addStaffOverride = async (e) => { e.preventDefault(); if (!staffOverridePick) return; await api.setAttachmentOverride("staff", staffOverridePick, staffOverrideAllow); setStaffOverridePick(""); load(); };
  const addClientOverride = async (e) => { e.preventDefault(); if (!clientOverridePick) return; await api.setAttachmentOverride("client", clientOverridePick, clientOverrideAllow); setClientOverridePick(""); load(); };
  const removeOverride = async (id) => { await api.removeAttachmentOverride(id); load(); };

  const addCatalogItem = async (e) => {
    e.preventDefault();
    if (!catalogForm.category || !catalogForm.name.trim()) return;
    await api.addPOCatalogItem(catalogForm);
    setCatalogForm({ category: catalogForm.category, name: "", spec: "" });
    load();
  };
  const removeCatalogItem = async (id) => { await api.removePOCatalogItem(id); load(); };

  const addField = async (e) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    await api.addCustomField({ entityType: "customer", fieldName: newFieldName });
    setNewFieldName("");
    load();
  };
  const removeField = async (id) => { await api.removeCustomField(id); load(); };

  const toggleNotif = async (id) => { await api.toggleNotificationPref(id); load(); };
  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await api.addCustomNotificationCategory(newCategory);
    setNewCategory("");
    load();
  };
  const removeCategory = async (id) => { await api.removeNotificationPref(id); load(); };

  const saveSettings = async (e) => {
    e.preventDefault();
    await api.updateSettings({
      businessName: settings.business_name, address: settings.address, phone: settings.phone,
      tin: settings.tin, invoicePrefix: settings.invoice_prefix, taxRatePercent: Number(settings.tax_rate_percent),
    });
    setSavedMsg("Saved.");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const changePw = async (e) => {
    e.preventDefault();
    setPwMsg("");
    try {
      await api.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwMsg("Password changed.");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPwMsg(err.message);
    }
  };

  const addPrinter = async (e) => {
    e.preventDefault();
    await api.addPrinterProfile(printerForm);
    setPrinterForm({ name: "", type: "Thermal", paperSize: "80mm" });
    load();
  };
  const setDefault = async (id) => { await api.setDefaultPrinter(id); load(); };
  const removePrinter = async (id) => { await api.removePrinterProfile(id); load(); };

  if (!settings) return <div style={{ color: C.textSoft }}>Loading…</div>;

  const field = (label, key, type = "text") => (
    <div className="mb-3">
      <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>{label}</label>
      <input type={type} value={settings[key] || ""} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
    </div>
  );

  return (
    <div>
      <h1 style={{ color: C.ink }} className="text-xl font-bold mb-6">Settings</h1>

      <form onSubmit={saveSettings} style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 mb-6 max-w-lg">
        <div style={{ color: C.ink }} className="text-sm font-bold mb-4">Business & Invoice Details</div>
        {field("Business name", "business_name")}
        {field("Address", "address")}
        {field("Phone", "phone")}
        {field("TIN", "tin")}
        {field("Invoice prefix", "invoice_prefix")}
        {field("Tax rate (%)", "tax_rate_percent", "number")}
        <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">Save</button>
        {savedMsg && <span style={{ color: "#166534" }} className="text-xs ml-3">{savedMsg}</span>}
      </form>

      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 mb-6 max-w-lg">
        <div style={{ color: C.ink }} className="text-sm font-bold mb-4">Logo & Branding</div>
        <div className="flex items-center gap-4 mb-4">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="" className="rounded-xl object-cover" style={{ width: settings.logo_size === "sm" ? 40 : settings.logo_size === "lg" ? 72 : 56, height: settings.logo_size === "sm" ? 40 : settings.logo_size === "lg" ? 72 : 56 }} />
          ) : (
            <div style={{ background: "linear-gradient(135deg, #2B6CF6, #FFC93C)", width: settings.logo_size === "sm" ? 40 : settings.logo_size === "lg" ? 72 : 56, height: settings.logo_size === "sm" ? 40 : settings.logo_size === "lg" ? 72 : 56 }} className="rounded-xl" />
          )}
          <div className="flex-1">
            <FileDropzone accept="image/*" label="Drop a logo image here" onUploaded={async (f) => { await api.updateSettings({ logoUrl: f.url }); load(); }} />
          </div>
        </div>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Logo size</label>
        <div className="flex gap-2 mb-4">
          {["sm", "md", "lg"].map((sz) => (
            <button key={sz} type="button" onClick={async () => { await api.updateSettings({ logoSize: sz }); load(); }} style={{ background: settings.logo_size === sz ? C.cyan : "#fff", color: settings.logo_size === sz ? "#fff" : C.ink, border: `1px solid ${C.border}` }} className="text-xs font-semibold px-3 py-1.5 rounded-lg uppercase">{sz}</button>
          ))}
        </div>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Tagline (shown under the logo)</label>
        <div className="flex gap-2">
          <input value={settings.tagline || ""} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button type="button" onClick={async () => { await api.updateSettings({ tagline: settings.tagline }); load(); }} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 rounded-lg">Save</button>
        </div>
      </div>

      {user?.isPrimaryOwner && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 mb-6 max-w-lg">
          <div style={{ color: C.ink }} className="text-sm font-bold mb-1">General Manager Accounts</div>
          <div style={{ color: C.textSoft }} className="text-xs mb-4">
            A General Manager sees and does everything you can — every branch, every module, no restrictions.
            You can pause their access at any time and pick everything back up yourself, then resume them
            whenever you're ready. Only your account (the original owner) can see this section.
          </div>
          {generalManagers.length === 0 && <div style={{ color: C.textSoft }} className="text-xs mb-3">No General Manager accounts yet.</div>}
          {generalManagers.map((gm) => (
            <div key={gm.id} className="flex items-center justify-between gap-2 flex-wrap py-2" style={{ borderTop: `1px solid ${C.border}`, opacity: gm.active ? 1 : 0.5 }}>
              <div>
                <span style={{ color: C.ink }} className="text-sm font-medium">{gm.name}</span>
                <span style={{ color: C.textSoft }} className="text-xs"> — {gm.username}{!gm.active ? " (paused)" : ""}</span>
              </div>
              <div className="flex gap-2">
                {gm.active
                  ? <button onClick={() => deactivateGm(gm.id)} className="text-xs font-semibold" style={{ color: C.amberDeep || "#92400E" }}>Pause</button>
                  : <button onClick={() => reactivateGm(gm.id)} className="text-xs font-semibold" style={{ color: "#166534" }}>Resume</button>}
                <button onClick={() => removeGm(gm.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
              </div>
            </div>
          ))}
          {gmError && <div style={{ background: "#FEE2E2", color: C.danger }} className="rounded-lg px-3 py-2 text-xs mt-2">{gmError}</div>}
          {!gmOpen ? (
            <button onClick={() => setGmOpen(true)} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg mt-3">+ Add General Manager</button>
          ) : (
            <form onSubmit={addGm} className="mt-3">
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Full name</label>
              <input required value={gmForm.name} onChange={(e) => setGmForm({ ...gmForm, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" />
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Username</label>
              <input required value={gmForm.username} onChange={(e) => setGmForm({ ...gmForm, username: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" />
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Password</label>
              <input required type="password" value={gmForm.password} onChange={(e) => setGmForm({ ...gmForm, password: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-2 text-sm" />
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Email (optional)</label>
              <input value={gmForm.email} onChange={(e) => setGmForm({ ...gmForm, email: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setGmOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
                <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Create Account</button>
              </div>
            </form>
          )}
        </div>
      )}

      <form onSubmit={changePw} style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 mb-6 max-w-lg">
        <div style={{ color: C.ink }} className="text-sm font-bold mb-4">Change Password</div>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Current password</label>
        <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>New password</label>
        <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
        <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">Update Password</button>
        {pwMsg && <span style={{ color: pwMsg.includes("changed") ? "#166534" : C.danger }} className="text-xs ml-3">{pwMsg}</span>}
      </form>

      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 max-w-lg">
        <div style={{ color: C.ink }} className="text-sm font-bold mb-4">Printer Profiles</div>
        {printers.map((p) => (
          <div key={p.id} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">{p.name} — {p.paper_size} {p.is_default ? "(default)" : ""}</span>
            <div className="flex gap-2">
              {!p.is_default && <button onClick={() => setDefault(p.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>Set Default</button>}
              <button onClick={() => removePrinter(p.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
            </div>
          </div>
        ))}
        <form onSubmit={addPrinter} className="flex gap-2 mt-3">
          <input placeholder="Name" value={printerForm.name} onChange={(e) => setPrinterForm({ ...printerForm, name: e.target.value })} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <select value={printerForm.paperSize} onChange={(e) => setPrinterForm({ ...printerForm, paperSize: e.target.value })} style={{ borderColor: C.border }} className="border rounded-lg px-3 py-2 text-sm">
            <option>80mm</option><option>58mm</option><option>A4</option>
          </select>
          <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 rounded-lg">Add</button>
        </form>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 max-w-lg mt-6">
        <div style={{ color: C.ink }} className="text-sm font-bold mb-1">Custom Customer Fields</div>
        <div style={{ color: C.textSoft }} className="text-xs mb-4">Add extra fields you want to capture for every customer — they'll show up on the Add Customer form.</div>
        {customFields.map((f) => (
          <div key={f.id} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">{f.field_name}</span>
            <button onClick={() => removeField(f.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
          </div>
        ))}
        {customFields.length === 0 && <div style={{ color: C.textSoft }} className="text-xs py-2">No custom fields yet.</div>}
        <form onSubmit={addField} className="flex gap-2 mt-3">
          <input placeholder="e.g. Loyalty Card Number" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 rounded-lg">Add</button>
        </form>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 max-w-lg mt-6">
        <div style={{ color: C.ink }} className="text-sm font-bold mb-1">Messaging & Attachments</div>
        <div style={{ color: C.textSoft }} className="text-xs mb-4">Turn attachments off by default to save storage, and allow specific people when needed.</div>

        <div className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <span style={{ color: C.ink }} className="text-sm">Staff attachments (Team Chat) — allowed by default</span>
          <button onClick={() => toggleGlobalAttachments("staffAttachmentsEnabled", !settings.staff_attachments_enabled)} style={{ background: settings.staff_attachments_enabled ? "#166534" : C.border, color: settings.staff_attachments_enabled ? "#fff" : C.textSoft }} className="text-xs font-semibold px-3 py-1 rounded-full shrink-0">{settings.staff_attachments_enabled ? "On" : "Off"}</button>
        </div>
        <div className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <span style={{ color: C.ink }} className="text-sm">Client attachments (Client Messages) — allowed by default</span>
          <button onClick={() => toggleGlobalAttachments("clientAttachmentsEnabled", !settings.client_attachments_enabled)} style={{ background: settings.client_attachments_enabled ? "#166534" : C.border, color: settings.client_attachments_enabled ? "#fff" : C.textSoft }} className="text-xs font-semibold px-3 py-1 rounded-full shrink-0">{settings.client_attachments_enabled ? "On" : "Off"}</button>
        </div>

        <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mt-4 mb-2">Staff exceptions (override the default above)</div>
        {staffOverrides.map((o) => (
          <div key={o.id} className="flex items-center justify-between py-1.5">
            <span style={{ color: C.ink }} className="text-sm">{o.person_name} — {o.allowed ? "allowed" : "blocked"}</span>
            <button onClick={() => removeOverride(o.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
          </div>
        ))}
        <form onSubmit={addStaffOverride} className="flex gap-2 mt-2">
          <select value={staffOverridePick} onChange={(e) => setStaffOverridePick(e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-2 py-1.5 text-xs">
            <option value="">Choose a staff member…</option>
            {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={staffOverrideAllow} onChange={(e) => setStaffOverrideAllow(e.target.value === "true")} style={{ borderColor: C.border }} className="border rounded-lg px-2 py-1.5 text-xs">
            <option value="true">Allow</option>
            <option value="false">Block</option>
          </select>
          <button type="submit" style={{ background: C.cyan }} className="text-white text-xs font-semibold px-3 rounded-lg">Set</button>
        </form>

        <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mt-4 mb-2">Client exceptions (override the default above)</div>
        {clientOverrides.map((o) => (
          <div key={o.id} className="flex items-center justify-between py-1.5">
            <span style={{ color: C.ink }} className="text-sm">{o.person_name} — {o.allowed ? "allowed" : "blocked"}</span>
            <button onClick={() => removeOverride(o.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
          </div>
        ))}
        <form onSubmit={addClientOverride} className="flex gap-2 mt-2">
          <select value={clientOverridePick} onChange={(e) => setClientOverridePick(e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-2 py-1.5 text-xs">
            <option value="">Choose a customer…</option>
            {customerList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={clientOverrideAllow} onChange={(e) => setClientOverrideAllow(e.target.value === "true")} style={{ borderColor: C.border }} className="border rounded-lg px-2 py-1.5 text-xs">
            <option value="true">Allow</option>
            <option value="false">Block</option>
          </select>
          <button type="submit" style={{ background: C.cyan }} className="text-white text-xs font-semibold px-3 rounded-lg">Set</button>
        </form>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 max-w-lg mt-6">
        <div style={{ color: C.ink }} className="text-sm font-bold mb-1">Notifications</div>
        <div style={{ color: C.textSoft }} className="text-xs mb-4">Turn off any category you don't want appearing in the reminders bell.</div>
        {notifPrefs.filter((n) => !n.is_custom).map((n) => (
          <div key={n.id} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">{n.category}</span>
            <button onClick={() => toggleNotif(n.id)} style={{ background: n.enabled ? "#166534" : C.border, color: n.enabled ? "#fff" : C.textSoft }} className="text-xs font-semibold px-3 py-1 rounded-full">{n.enabled ? "On" : "Off"}</button>
          </div>
        ))}
        <div style={{ color: C.textSoft }} className="text-xs mt-4 mb-2">Custom categories (informational only — no automatic alerts)</div>
        {notifPrefs.filter((n) => n.is_custom).map((n) => (
          <div key={n.id} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">{n.category}</span>
            <button onClick={() => removeCategory(n.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
          </div>
        ))}
        <form onSubmit={addCategory} className="flex gap-2 mt-3">
          <input placeholder="e.g. Birthday Reminders" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 rounded-lg">Add Category</button>
        </form>
      </div>

      <div style={{ color: C.ink, fontWeight: 700 }} className="text-sm mt-8 mb-2">Category Lists</div>
      <div style={{ color: C.textSoft }} className="text-xs mb-2 max-w-lg">Every dropdown in the app (services, products, expenses, purchase orders, client segments, cash flow) pulls from these lists — add or remove options here and they show up everywhere immediately.</div>
      <CategoryManager type="service" title="Service Categories" />
      <CategoryManager type="product" title="Product Categories" />
      <CategoryManager type="supplier" title="Supplier Categories" />
      <CategoryManager type="expense" title="Expense Categories" />
      <CategoryManager type="purchase_order" title="Purchase Order Categories" />

      <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 max-w-lg mt-6">
        <div style={{ color: C.ink }} className="text-sm font-bold mb-1">Purchase Order Catalog</div>
        <div style={{ color: C.textSoft }} className="text-xs mb-4">Pre-defined items staff can tap to add when building a purchase order, organized by category.</div>
        {poCatalog.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-2 flex-wrap py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <div>
              <span style={{ color: C.ink }} className="text-sm font-medium">{c.name}</span>
              <span style={{ color: C.textSoft }} className="text-xs"> — {c.category}{c.spec ? ` · ${c.spec}` : ""}</span>
            </div>
            <button onClick={() => removeCatalogItem(c.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
          </div>
        ))}
        {poCatalog.length === 0 && <div style={{ color: C.textSoft }} className="text-xs py-2">No catalog items yet.</div>}
        <form onSubmit={addCatalogItem} className="flex flex-col gap-2 mt-3">
          <select required value={catalogForm.category} onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })} style={{ borderColor: C.border }} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Choose category…</option>
            {poCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input placeholder="Item name" value={catalogForm.name} onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Spec (optional)" value={catalogForm.spec} onChange={(e) => setCatalogForm({ ...catalogForm, spec: e.target.value })} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 py-2 rounded-lg">Add to Catalog</button>
        </form>
      </div>

      <CategoryManager type="client_segment" title="Client Segments / Tags" />
      <CategoryManager type="cashflow" title="Cash Flow Categories" />
    </div>
  );
}
