import React, { useState, useEffect, useRef } from "react";
import { api } from "../api.js";
import { useUser } from "../App.jsx";
import FileDropzone from "../components/FileDropzone.jsx";
import CategoryManager from "../components/CategoryManager.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import { QRCodeSVG } from "qrcode.react";
import { Check, Settings2, ShieldCheck, X } from "lucide-react";

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
  const [branches, setBranches] = useState([]);
  const [branchForm, setBranchForm] = useState({ name: "", color: "#2B6CF6" });
  const [branchCustomValues, setBranchCustomValues] = useState({});
  const [branchEditing, setBranchEditing] = useState(null);
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchFields, setBranchFields] = useState([]);
  const [branchFieldsOpen, setBranchFieldsOpen] = useState(false);
  const [newBranchFieldName, setNewBranchFieldName] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");
  const [quickPointInfo, setQuickPointInfo] = useState(null);
  const [notifStatus, setNotifStatus] = useState(null);
  const [paymentCodes, setPaymentCodes] = useState([]);
  const [pcOpen, setPcOpen] = useState(false);
  const [pcForm, setPcForm] = useState({ mode: "custom", label: "", amount: "", serviceId: "", productId: "" });
  const [pcServices, setPcServices] = useState([]);
  const [pcProducts, setPcProducts] = useState([]);
  const [printCode, setPrintCode] = useState(null);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testSmsTo, setTestSmsTo] = useState("");
  const [testEmailMsg, setTestEmailMsg] = useState(null);
  const [testSmsMsg, setTestSmsMsg] = useState(null);
  const [testBusy, setTestBusy] = useState(false);
  const restoreFileRef = useRef(null);
  const [printerForm, setPrinterForm] = useState({ name: "", type: "Thermal", paperSize: "80mm" });
  const [poCategories, setPoCategories] = useState([]);
  const [poCatalog, setPoCatalog] = useState([]);
  const [catalogForm, setCatalogForm] = useState({ category: "", name: "", spec: "" });

  const load = () => Promise.all([api.getSettings(), api.getPrinterProfiles(), api.getCustomFields("customer"), api.getNotificationPrefs(), api.getCategories("purchase_order"), api.getPOCatalog(), api.getStaff(), api.getCustomers(), api.getAttachmentOverrides("staff"), api.getAttachmentOverrides("client")])
    .then(([s, p, cf, np, poc, cat, st, cust, so, co]) => { setSettings(s); setPrinters(p); setCustomFields(cf); setNotifPrefs(np); setPoCategories(poc); setPoCatalog(cat); setStaffList(st); setCustomerList(cust); setStaffOverrides(so); setClientOverrides(co); });
  useEffect(() => { load(); }, []);
  useEffect(() => { api.getBranches().then(setBranches); }, []);
  useEffect(() => { api.getCustomFields("branch").then(setBranchFields); }, []);

  const addBranchField = async (e) => {
    e.preventDefault();
    if (!newBranchFieldName.trim()) return;
    await api.addCustomField({ entityType: "branch", fieldName: newBranchFieldName });
    setNewBranchFieldName("");
    api.getCustomFields("branch").then(setBranchFields);
  };
  const removeBranchField = async (id) => { await api.removeCustomField(id); api.getCustomFields("branch").then(setBranchFields); };

  const openBranchAdd = () => { setBranchEditing(null); setBranchForm({ name: "", color: "#2B6CF6" }); setBranchCustomValues({}); setBranchOpen(true); };
  const openBranchEdit = (b) => { setBranchEditing(b.id); setBranchForm({ name: b.name, color: b.color || "#2B6CF6" }); setBranchCustomValues(b.custom_data || {}); setBranchOpen(true); };
  const saveBranch = async (e) => {
    e.preventDefault();
    const payload = { ...branchForm, customData: branchCustomValues };
    if (branchEditing) await api.updateBranch(branchEditing, payload);
    else await api.addBranch(payload);
    setBranchOpen(false);
    api.getBranches().then(setBranches);
  };
  const removeBranch = async (id) => { if (confirm("Remove this branch? This cannot be undone.")) { await api.removeBranch(id); api.getBranches().then(setBranches); } };
  useEffect(() => { if (user?.isPrimaryOwner) api.getGeneralManagers().then(setGeneralManagers); }, [user]);
  useEffect(() => { if (user?.role === "owner") api.getQuickRestorePointInfo().then(setQuickPointInfo); }, [user]);
  useEffect(() => { if (user?.role === "owner") api.getNotificationStatus().then(setNotifStatus); }, [user]);
  useEffect(() => {
    if (user?.role !== "owner") return;
    api.getPaymentCodes().then(setPaymentCodes);
    api.getServices().then(setPcServices);
    api.getProducts().then((p) => setPcProducts(p.filter((x) => x.sellable)));
  }, [user]);

  const reloadPaymentCodes = () => api.getPaymentCodes().then(setPaymentCodes);
  const openPcAdd = () => { setPcForm({ mode: "custom", label: "", amount: "", serviceId: "", productId: "" }); setPcOpen(true); };
  const submitPc = async (e) => {
    e.preventDefault();
    const payload = { label: pcForm.label };
    if (pcForm.mode === "custom") payload.amount = pcForm.amount ? Number(pcForm.amount) : undefined;
    if (pcForm.mode === "service") { payload.serviceId = pcForm.serviceId; payload.label = pcServices.find((s) => s.id === pcForm.serviceId)?.name || pcForm.label; }
    if (pcForm.mode === "product") { payload.productId = pcForm.productId; payload.label = pcProducts.find((p) => p.id === pcForm.productId)?.name || pcForm.label; }
    await api.addPaymentCode(payload);
    setPcOpen(false);
    reloadPaymentCodes();
  };
  const togglePc = async (id) => { await api.togglePaymentCode(id); reloadPaymentCodes(); };
  const removePc = async (id) => { if (confirm("Remove this payment code permanently? Any printed copies will stop working.")) { await api.removePaymentCode(id); reloadPaymentCodes(); } };

  const runTestEmail = async (e) => {
    e.preventDefault();
    setTestBusy(true); setTestEmailMsg(null);
    try {
      const result = await api.testEmail(testEmailTo);
      setTestEmailMsg({ success: result.sent, text: result.sent ? "Sent — check that inbox now." : `Not sent: ${result.reason}` });
    } catch (err) {
      setTestEmailMsg({ success: false, text: err.message });
    } finally {
      setTestBusy(false);
    }
  };

  const runTestSms = async (e) => {
    e.preventDefault();
    setTestBusy(true); setTestSmsMsg(null);
    try {
      const result = await api.testSms(testSmsTo);
      setTestSmsMsg({ success: result.sent, text: result.sent ? "Sent — check that phone now." : `Not sent: ${result.reason}` });
    } catch (err) {
      setTestSmsMsg({ success: false, text: err.message });
    } finally {
      setTestBusy(false);
    }
  };


  const doExport = async () => {
    setBackupBusy(true); setBackupMsg("");
    try {
      const data = await api.exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `wosha-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupMsg("Backup downloaded.");
    } catch (err) {
      setBackupMsg(err.message);
    } finally {
      setBackupBusy(false);
    }
  };

  const doRestoreFromFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm("This replaces existing business data with the contents of this backup file (login accounts are never touched). Continue?")) { e.target.value = ""; return; }
    setBackupBusy(true); setBackupMsg("");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await api.restoreBackup(parsed.tables || parsed);
      setBackupMsg("Restore complete. Reloading…");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setBackupMsg(err.message || "That file couldn't be read as a valid backup.");
    } finally {
      setBackupBusy(false);
      e.target.value = "";
    }
  };

  const doSaveQuickPoint = async () => {
    setBackupBusy(true); setBackupMsg("");
    try {
      await api.saveQuickRestorePoint();
      setBackupMsg("Restore point saved.");
      api.getQuickRestorePointInfo().then(setQuickPointInfo);
    } catch (err) {
      setBackupMsg(err.message);
    } finally {
      setBackupBusy(false);
    }
  };

  const doRestoreQuickPoint = async () => {
    if (!confirm("Roll everything back to the last saved restore point? This replaces current business data (login accounts are never touched).")) return;
    setBackupBusy(true); setBackupMsg("");
    try {
      await api.restoreQuickPoint();
      setBackupMsg("Restored. Reloading…");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setBackupMsg(err.message);
    } finally {
      setBackupBusy(false);
    }
  };


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
        <div className="flex gap-2 mb-4">
          <input value={settings.tagline || ""} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button type="button" onClick={async () => { await api.updateSettings({ tagline: settings.tagline }); load(); }} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 rounded-lg">Save</button>
        </div>

        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Sidebar & top bar color</label>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {["#0B1B33", "#1E3A8A", "#2B6CF6", "#0F172A", "#134E4A", "#3730A3"].map((c) => (
            <button key={c} type="button" onClick={async () => { await api.updateSettings({ sidebarColor: c }); load(); }} style={{ background: c, border: settings.sidebar_color === c ? `2px solid ${C.cyan}` : "2px solid transparent" }} className="w-8 h-8 rounded-full" />
          ))}
          <input type="color" value={settings.sidebar_color || "#0B1B33"} onChange={async (e) => { await api.updateSettings({ sidebarColor: e.target.value }); load(); }} className="w-8 h-8 rounded-full border-0 cursor-pointer" style={{ padding: 0 }} />
        </div>
        <div style={{ color: C.textSoft }} className="text-xs">Changes everywhere the sidebar and top bar appear, for everyone who logs in.</div>
      </div>

      {(user?.role === "owner") && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 mb-6 max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <div style={{ color: C.ink }} className="text-sm font-bold">Branches</div>
            <button onClick={() => setBranchFieldsOpen(true)} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Settings2 size={13} /> Manage Branch Info Fields</button>
          </div>
          {branches.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2 flex-wrap py-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2">
                <span style={{ background: b.color || C.cyan, width: 10, height: 10 }} className="rounded-full shrink-0" />
                <span style={{ color: C.ink }} className="text-sm">{b.name}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openBranchEdit(b)} className="text-xs font-semibold" style={{ color: C.cyan }}>Edit</button>
                <button onClick={() => removeBranch(b.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
              </div>
            </div>
          ))}
          {branches.length === 0 && <div style={{ color: C.textSoft }} className="text-xs py-2">No branches yet.</div>}
          <button onClick={openBranchAdd} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg mt-3">+ Add Branch</button>
        </div>
      )}

      {user?.role === "owner" && notifStatus && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 mb-6 max-w-lg">
          <div style={{ color: C.ink }} className="text-sm font-bold mb-1">Email & SMS Delivery</div>
          <div style={{ color: C.textSoft }} className="text-xs mb-4">
            Used for password reset codes and supplier quotation emails. Add your SendGrid and Africa's Talking
            keys to Render's Environment tab (see .env.example for exactly how) to turn these on — until then,
            these messages just get logged instead of actually sent, and the app works fine either way.
          </div>

          <div className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">Email (SendGrid)</span>
            <span style={{ background: notifStatus.emailConfigured ? "#E6F4EA" : "#F1F2F4", color: notifStatus.emailConfigured ? "#166534" : C.textSoft }} className="text-xs font-semibold px-3 py-1 rounded-full">{notifStatus.emailConfigured ? "Configured" : "Not configured"}</span>
          </div>
          {notifStatus.emailConfigured && (
            <form onSubmit={runTestEmail} className="flex gap-2 mt-2 mb-1">
              <input required type="email" value={testEmailTo} onChange={(e) => setTestEmailTo(e.target.value)} placeholder="Send a real test to…" style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button type="submit" disabled={testBusy} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 rounded-lg disabled:opacity-50">Send Test</button>
            </form>
          )}
          {testEmailMsg && <div style={{ color: testEmailMsg.success ? "#166534" : C.danger }} className="text-xs mb-2 flex items-center gap-1">{testEmailMsg.success && <Check size={12} />} {testEmailMsg.text}</div>}

          <div className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">SMS (Africa's Talking)</span>
            <span style={{ background: notifStatus.smsConfigured ? "#E6F4EA" : "#F1F2F4", color: notifStatus.smsConfigured ? "#166534" : C.textSoft }} className="text-xs font-semibold px-3 py-1 rounded-full">{notifStatus.smsConfigured ? "Configured" : "Not configured"}</span>
          </div>
          {notifStatus.smsConfigured && (
            <form onSubmit={runTestSms} className="flex gap-2 mt-2 mb-1">
              <input required value={testSmsTo} onChange={(e) => setTestSmsTo(e.target.value)} placeholder="Send a real test to… (+255...)" style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button type="submit" disabled={testBusy} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 rounded-lg disabled:opacity-50">Send Test</button>
            </form>
          )}
          {testSmsMsg && <div style={{ color: testSmsMsg.success ? "#166534" : C.danger }} className="text-xs flex items-center gap-1">{testSmsMsg.success && <Check size={12} />} {testSmsMsg.text}</div>}
        </div>
      )}

      {user?.role === "owner" && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 mb-6 max-w-lg">
          <div style={{ color: C.ink }} className="text-sm font-bold mb-1">Payment Barcodes</div>
          <div style={{ color: C.textSoft }} className="text-xs mb-3">
            Print one, stick it up front — anyone can scan it with their own phone camera to see exactly
            what's owed and how to pay (no app needed on their end). This shows payment details and your
            instructions; it doesn't auto-charge a bank or mobile money account — that would require
            registering with Tanzania's national payment system directly.
          </div>
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Payment instructions (shown on the page when someone scans a code)</label>
          <textarea rows={2} defaultValue={settings.payment_instructions || ""} onBlur={async (e) => { await api.updateSettings({ paymentInstructions: e.target.value }); load(); }} placeholder="e.g. Pay via Tigo Pesa: 0712 345 678, or ask staff for a Control Number." style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />

          {paymentCodes.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 flex-wrap py-2.5" style={{ borderTop: `1px solid ${C.border}`, opacity: c.active ? 1 : 0.5 }}>
              <div>
                <div style={{ color: C.ink }} className="text-sm font-semibold">{c.label}{!c.active && " (disabled)"}</div>
                <div style={{ color: C.textSoft }} className="text-xs">{c.amount ? `TZS ${Number(c.amount).toLocaleString()}` : c.service_name ? "Priced from service" : c.product_name ? "Priced from product" : "Amount shown at scan time"} · code {c.code}</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setPrintCode(c)} className="text-xs font-semibold" style={{ color: C.cyan }}>View / Print</button>
                <button onClick={() => togglePc(c.id)} className="text-xs font-semibold" style={{ color: C.textSoft }}>{c.active ? "Disable" : "Enable"}</button>
                <button onClick={() => removePc(c.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
              </div>
            </div>
          ))}
          {paymentCodes.length === 0 && <div style={{ color: C.textSoft }} className="text-xs py-2">No payment codes yet.</div>}
          <button onClick={openPcAdd} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg mt-3">+ Create Payment Code</button>
        </div>
      )}

      {user?.role === "owner" && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="rounded-xl p-6 mb-6 max-w-lg">
          <div style={{ color: C.ink }} className="text-sm font-bold mb-1">Backup & Restore</div>
          <div style={{ color: C.textSoft }} className="text-xs mb-4">Download a full backup of every record in the system (customers, bookings, invoices, staff, settings — everything except passwords) as a JSON file you can store or send to the backend.</div>
          <div className="flex gap-2 mb-4">
            <button onClick={doExport} disabled={backupBusy} style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50">⧉ Export All Data (JSON)</button>
            <button onClick={() => restoreFileRef.current?.click()} disabled={backupBusy} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="flex-1 text-sm font-semibold py-2 rounded-lg disabled:opacity-50">Restore from Backup File…</button>
            <input ref={restoreFileRef} type="file" accept="application/json" onChange={doRestoreFromFile} className="hidden" />
          </div>

          <div style={{ borderTop: `1px solid ${C.border}` }} className="pt-4">
            <div style={{ color: C.ink }} className="text-sm font-bold mb-1">Quick restore point</div>
            <div style={{ color: C.textSoft }} className="text-xs mb-3">Save a one-tap snapshot of everything right now — if something gets changed by mistake (or by someone who shouldn't have access), you can instantly roll back to this exact point without needing a file.{quickPointInfo?.exists && ` Last saved: ${new Date(quickPointInfo.savedAt).toLocaleString()}.`}</div>
            <div className="flex flex-col gap-2">
              <button onClick={doSaveQuickPoint} disabled={backupBusy} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-sm font-semibold py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"><ShieldCheck size={15} /> Save Restore Point Now</button>
              <button onClick={doRestoreQuickPoint} disabled={backupBusy || !quickPointInfo?.exists} style={{ background: "#FFC93C", color: C.ink }} className="text-sm font-semibold py-2 rounded-lg disabled:opacity-50">Restore to Last Point</button>
            </div>
          </div>
          {backupMsg && <div style={{ color: backupMsg.includes("couldn't") || backupMsg.includes("fail") ? C.danger : "#166534" }} className="text-xs mt-3">{backupMsg}</div>}

          <div style={{ borderTop: `1px solid ${C.border}` }} className="pt-4 mt-4">
            <div style={{ color: C.ink }} className="text-sm font-bold mb-1">Account security</div>
            <div style={{ color: C.textSoft }} className="text-xs">Every account is protected against password-guessing attacks: after 5 failed login attempts, that account locks for 15 minutes automatically. Passwords are never stored in plain text (hashed with a unique salt per account), and export/backup files never contain password data.</div>
          </div>
        </div>
      )}

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
          <div style={{ width: 110 }}>
            <CustomSelect value={printerForm.paperSize} onChange={(v) => setPrinterForm({ ...printerForm, paperSize: v })} options={["80mm", "58mm", "A4"].map((p) => ({ value: p, label: p }))} className="w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between" style={{ borderColor: C.border }} />
          </div>
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
          <div className="flex-1">
            <CustomSelect value={staffOverridePick} onChange={setStaffOverridePick} placeholder="Choose a staff member…" options={staffList.map((s) => ({ value: s.id, label: s.name }))} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between" style={{ borderColor: C.border }} />
          </div>
          <div style={{ width: 90 }}>
            <CustomSelect value={String(staffOverrideAllow)} onChange={(v) => setStaffOverrideAllow(v === "true")} options={[{ value: "true", label: "Allow" }, { value: "false", label: "Block" }]} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between" style={{ borderColor: C.border }} />
          </div>
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
          <div className="flex-1">
            <CustomSelect value={clientOverridePick} onChange={setClientOverridePick} placeholder="Choose a customer…" options={customerList.map((c) => ({ value: c.id, label: c.name }))} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between" style={{ borderColor: C.border }} />
          </div>
          <div style={{ width: 90 }}>
            <CustomSelect value={String(clientOverrideAllow)} onChange={(v) => setClientOverrideAllow(v === "true")} options={[{ value: "true", label: "Allow" }, { value: "false", label: "Block" }]} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between" style={{ borderColor: C.border }} />
          </div>
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
          <CustomSelect required value={catalogForm.category} onChange={(v) => setCatalogForm({ ...catalogForm, category: v })} placeholder="Choose category…" options={poCategories.map((c) => ({ value: c.name, label: c.name }))} className="w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between" style={{ borderColor: C.border }} />
          <div className="flex gap-2">
            <input placeholder="Item name" value={catalogForm.name} onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Spec (optional)" value={catalogForm.spec} onChange={(e) => setCatalogForm({ ...catalogForm, spec: e.target.value })} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 py-2 rounded-lg">Add to Catalog</button>
        </form>
      </div>

      <CategoryManager type="client_segment" title="Client Segments / Tags" />
      <CategoryManager type="cashflow" title="Cash Flow Categories" />
      <CategoryManager type="task_template" title="Task Templates (Compliance & Tasks)" />
      <CategoryManager type="branch_target" title="Branch Target Categories" />

      {branchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={saveBranch} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">{branchEditing ? "Edit Branch" : "Add Branch"}</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Branch name</label>
            <input required value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Color</label>
            <input type="color" value={branchForm.color} onChange={(e) => setBranchForm({ ...branchForm, color: e.target.value })} className="w-full h-10 border rounded-lg mb-4" style={{ borderColor: C.border }} />
            {branchFields.map((f) => (
              <div key={f.id}>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>{f.field_name}</label>
                <input value={branchCustomValues[f.field_name] || ""} onChange={(e) => setBranchCustomValues({ ...branchCustomValues, [f.field_name]: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
              </div>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={() => setBranchOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Save</button>
            </div>
          </form>
        </div>
      )}

      {branchFieldsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <div style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div style={{ color: C.ink }} className="text-lg font-bold">Manage Branch Info Fields</div>
              <button onClick={() => setBranchFieldsOpen(false)} style={{ color: C.textSoft }}><X size={18} /></button>
            </div>
            {branchFields.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
                <span style={{ color: C.ink }} className="text-sm">{f.field_name}</span>
                <button onClick={() => removeBranchField(f.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
              </div>
            ))}
            {branchFields.length === 0 && <div style={{ color: C.textSoft }} className="text-xs py-2">No extra fields yet — e.g. "Address", "Phone".</div>}
            <form onSubmit={addBranchField} className="flex gap-2 mt-3">
              <input placeholder="e.g. Address" value={newBranchFieldName} onChange={(e) => setNewBranchFieldName(e.target.value)} style={{ borderColor: C.border }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button type="submit" style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 rounded-lg">+ Add New Category</button>
            </form>
          </div>
        </div>
      )}

      {pcOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={submitPc} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">Create Payment Code</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>What is this code for?</label>
            <div className="mb-3">
              <CustomSelect value={pcForm.mode} onChange={(v) => setPcForm({ ...pcForm, mode: v })} options={[
                { value: "custom", label: "Custom label / amount" },
                { value: "service", label: "A specific service (price auto-fills)" },
                { value: "product", label: "A specific product (price auto-fills)" },
              ]} />
            </div>
            {pcForm.mode === "custom" && (
              <>
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Label</label>
                <input required value={pcForm.label} onChange={(e) => setPcForm({ ...pcForm, label: e.target.value })} placeholder="e.g. Front Desk Payment" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Amount (TZS) — leave blank if it varies</label>
                <input type="number" value={pcForm.amount} onChange={(e) => setPcForm({ ...pcForm, amount: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />
              </>
            )}
            {pcForm.mode === "service" && (
              <div className="mb-4">
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Service</label>
                <CustomSelect required value={pcForm.serviceId} onChange={(v) => setPcForm({ ...pcForm, serviceId: v })} options={pcServices.map((s) => ({ value: s.id, label: `${s.name} — TZS ${Number(s.price).toLocaleString()}` }))} />
              </div>
            )}
            {pcForm.mode === "product" && (
              <div className="mb-4">
                <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Product</label>
                <CustomSelect required value={pcForm.productId} onChange={(v) => setPcForm({ ...pcForm, productId: v })} options={pcProducts.map((p) => ({ value: p.id, label: `${p.name} — TZS ${Number(p.sell_price).toLocaleString()}` }))} />
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setPcOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
              <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Create</button>
            </div>
          </form>
        </div>
      )}

      {printCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <div style={{ background: "#fff" }} className="wosha-printable w-full max-w-xs rounded-xl p-8 text-center">
            {settings.logo_url && <img src={settings.logo_url} alt="" style={{ height: 40 }} className="mx-auto mb-2 object-contain" />}
            <div style={{ color: C.ink }} className="text-base font-bold mb-1">{settings.business_name || "Wosha"}</div>
            <div style={{ color: C.ink }} className="text-sm font-semibold mb-4">{printCode.label}</div>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={`${window.location.origin}/pay/${printCode.code}`} size={200} level="M" />
            </div>
            {printCode.amount && <div style={{ color: C.ink }} className="text-lg font-bold mb-1">TZS {Number(printCode.amount).toLocaleString()}</div>}
            <div style={{ color: C.textSoft }} className="text-xs mb-6">Scan with any phone camera to see how to pay</div>
            <div className="wosha-no-print flex gap-2">
              <button onClick={() => setPrintCode(null)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Close</button>
              <button onClick={() => window.print()} style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
