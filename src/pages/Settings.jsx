import React, { useState, useEffect, useRef } from "react";
import { api } from "../api.js";
import { useUser, useBrand, C } from "../App.jsx";
import LogoUpload from "../components/LogoUpload.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import CategoryManager from "../components/CategoryManager.jsx";
import ColorPickerButton from "../components/ColorPickerButton.jsx";
import { CollapsibleSection, CollapsibleSubSection } from "../components/ui.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import { QRCodeSVG } from "qrcode.react";
import { PrintHeader, PrintFooter } from "../components/PrintHeaderFooter.jsx";
import { Check, Settings2, ShieldCheck, X, Star, Globe, Image as ImageIcon } from "lucide-react";
import { getIconSizePref } from "../theme.js";
import { PageHeader, Button, LoadingState, Modal, FieldLabel } from "../components/ui.jsx";
import FileDropzone from "../components/FileDropzone.jsx";

export default function Settings() {
  const { user } = useUser();
  const { refreshBrand, layoutStyle } = useBrand();
  const [iconPref, setIconPref] = useState(getIconSizePref);
  const [settings, setSettings] = useState(null);
  const [printers, setPrinters] = useState([]);
  const [previewPrinter, setPreviewPrinter] = useState(null);
  const [editingTile, setEditingTile] = useState("bookings");
  const [bluetoothSupportMsg, setBluetoothSupportMsg] = useState("");
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

  // Public website content management — testimonials, media gallery, and the
  // small set of front-end toggles (hero text, default language, which sections
  // show), all editable here so nothing on the public site requires touching code.
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialForm, setTestimonialForm] = useState({ customerName: "", quote: "", rating: 5, photoUrl: "" });
  const [testimonialOpen, setTestimonialOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryForm, setGalleryForm] = useState({ title: "", mediaUrl: "", mediaType: "image" });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [websiteContentForm, setWebsiteContentForm] = useState({ defaultLanguage: "en", heroHeadline: "", heroSubheadline: "", showStats: true, showTestimonials: true, showGallery: true });
  const [websiteSavedMsg, setWebsiteSavedMsg] = useState("");
  const [siteVisitCount, setSiteVisitCount] = useState(null);

  useEffect(() => {
    api.getTestimonials().then(setTestimonials).catch(() => {});
    api.getMediaGallery().then(setGalleryItems).catch(() => {});
    api.getSiteVisitCount().then((r) => setSiteVisitCount(r.count)).catch(() => {});
  }, []);
  useEffect(() => {
    if (settings?.website_content) setWebsiteContentForm((f) => ({ ...f, ...settings.website_content }));
  }, [settings]);

  const reloadTestimonials = () => api.getTestimonials().then(setTestimonials);
  const submitTestimonial = async (e) => {
    e.preventDefault();
    if (!testimonialForm.customerName.trim() || !testimonialForm.quote.trim()) return;
    await api.addTestimonial(testimonialForm);
    setTestimonialForm({ customerName: "", quote: "", rating: 5, photoUrl: "" });
    setTestimonialOpen(false);
    reloadTestimonials();
  };
  const toggleTestimonialVisible = async (id) => { await api.toggleTestimonial(id); reloadTestimonials(); };
  const removeTestimonialItem = async (id) => { if (confirm("Remove this testimonial?")) { await api.removeTestimonial(id); reloadTestimonials(); } };

  const reloadGallery = () => api.getMediaGallery().then(setGalleryItems);
  const submitGalleryItem = async (e) => {
    e.preventDefault();
    if (!galleryForm.mediaUrl) return;
    await api.addMediaGalleryItem(galleryForm);
    setGalleryForm({ title: "", mediaUrl: "", mediaType: "image" });
    setGalleryOpen(false);
    reloadGallery();
  };
  const toggleGalleryVisible = async (id) => { await api.toggleMediaGalleryItem(id); reloadGallery(); };
  const removeGalleryItem = async (id) => { if (confirm("Remove this media item?")) { await api.removeMediaGalleryItem(id); reloadGallery(); } };

  const saveWebsiteContent = async (e) => {
    e.preventDefault();
    await api.updateWebsiteContent(websiteContentForm);
    setWebsiteSavedMsg("Saved — changes are live on the website immediately.");
    setTimeout(() => setWebsiteSavedMsg(""), 3000);
  };
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
  const [printerForm, setPrinterForm] = useState({ name: "", type: "Thermal", paperSize: "80mm", connection: "usb" });
  const [poCategories, setPoCategories] = useState([]);
  const [poCatalog, setPoCatalog] = useState([]);
  const [catalogForm, setCatalogForm] = useState({ category: "", name: "", spec: "" });

  const load = () => Promise.all([api.getSettings(), api.getPrinterProfiles(), api.getCustomFields("customer"), api.getNotificationPrefs(), api.getCategories("purchase_order"), api.getPOCatalog(), api.getStaff(), api.getCustomers(), api.getAttachmentOverrides("staff"), api.getAttachmentOverrides("client")])
    .then(([s, p, cf, np, poc, cat, st, cust, so, co]) => { setSettings(s); setPrinters(p); setCustomFields(cf); setNotifPrefs(np); setPoCategories(poc); setPoCatalog(cat); setStaffList(st); setCustomerList(cust); setStaffOverrides(so); setClientOverrides(co); refreshBrand(); });
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
  useEffect(() => { if (user?.isPrimaryOwner) api.getQuickRestorePointInfo().then(setQuickPointInfo); }, [user]);
  useEffect(() => { if (user?.isPrimaryOwner) api.getNotificationStatus().then(setNotifStatus); }, [user]);
  useEffect(() => {
    if (user?.role !== "owner") return;
    api.getPaymentCodes().then(setPaymentCodes);
    api.getServices().then(setPcServices);
    api.getProducts().then((p) => setPcProducts(p.filter((x) => x.sellable)));
  }, [user]);

  const reloadPaymentCodes = () => api.getPaymentCodes().then(setPaymentCodes);
  const openPcAdd = () => { setPcForm({ mode: "custom", label: "", amount: "", serviceId: "", productId: "" }); setPcOpen(true); };
  const [attachmentBusy, setAttachmentBusy] = useState({ header: false, footer: false });
  const uploadPrintAttachment = async (slot, file) => {
    if (!file) return;
    setAttachmentBusy((b) => ({ ...b, [slot]: true }));
    try {
      const result = await api.uploadPrintAttachment(file);
      await api.setPrintAttachment(slot, result);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setAttachmentBusy((b) => ({ ...b, [slot]: false }));
    }
  };
  const clearPrintAttachment = async (slot) => { await api.clearPrintAttachment(slot); load(); };
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
    load();
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
    setPrinterForm({ name: "", type: "Thermal", paperSize: "80mm", connection: "usb" });
    load();
  };
  const setDefault = async (id) => { await api.setDefaultPrinter(id); load(); };
  const removePrinter = async (id) => { await api.removePrinterProfile(id); load(); };

  // Opens the browser's own native Bluetooth device picker — a real system
  // dialog, not a mockup. Genuinely supported in Chrome (desktop + Android);
  // Safari and iOS don't implement the Web Bluetooth API at all, so this is
  // honest about that limitation rather than pretending it works everywhere.
  // Actual print jobs still go through the standard print dialog — sending
  // raw print commands directly over Bluetooth needs printer-specific
  // protocol support that varies by manufacturer.
  const pairBluetoothPrinter = async () => {
    if (!navigator.bluetooth) {
      setBluetoothSupportMsg("Bluetooth pairing isn't available in this browser. Try Chrome on Android or desktop.");
      return;
    }
    try {
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
      setPrinterForm((f) => ({ ...f, bluetoothName: device.name || "Unnamed device" }));
      setBluetoothSupportMsg("");
    } catch (err) {
      if (err.name !== "NotFoundError") setBluetoothSupportMsg("Pairing was cancelled or the device wasn't found.");
    }
  };

  if (!settings) return <LoadingState />;

  const field = (label, key, type = "text") => (
    <div className="mb-3">
      <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>{label}</label>
      <input type={type} value={settings[key] || ""} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Settings" />

      {user?.isPrimaryOwner && (
      <>
      <form onSubmit={saveSettings} className="bg-white rounded-2xl p-6 mb-6 max-w-lg">
        <div style={{ color: C.ink }} className="text-sm font-bold mb-4">Business & Invoice Details</div>
        {field("Business name", "business_name")}
        {field("Address", "address")}
        {field("Phone", "phone")}
        {field("TIN", "tin")}
        {field("Invoice prefix", "invoice_prefix")}
        {field("Tax rate (%)", "tax_rate_percent", "number")}
        <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">Save</button>
        {savedMsg && <span style={{ color: "#185FA5" }} className="text-xs ml-3">{savedMsg}</span>}
      </form>

      <div className="bg-white rounded-2xl p-6 mb-6 max-w-lg">
        <div style={{ color: C.ink }} className="text-sm font-bold mb-4">Logo & Branding</div>
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          <LogoUpload value={settings.logo_url} onChange={async (url) => { await api.updateSettings({ logoUrl: url }); load(); }} />
          {settings.logo_url && (
            <button type="button" onClick={async () => { if (confirm("Remove the logo? This reverts to the default Wosha mark everywhere it's shown.")) { await api.updateSettings({ logoUrl: "" }); load(); } }} style={{ color: "#DC2626" }} className="text-xs font-semibold">Remove Logo</button>
          )}
        </div>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Logo size</label>
        <div className="flex gap-2 mb-4">
          {["sm", "md", "lg"].map((sz) => (
            <button key={sz} type="button" onClick={async () => { await api.updateSettings({ logoSize: sz }); load(); }} style={{ background: settings.logo_size === sz ? C.cyan : "#fff", color: settings.logo_size === sz ? "#fff" : C.ink, border: `1px solid ${C.border}` }} className="text-xs font-semibold px-3 py-1.5 rounded-lg uppercase">{sz}</button>
          ))}
        </div>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Tagline (shown under the logo)</label>
        <div className="flex flex-wrap gap-2 mb-4">
          <input value={settings.tagline || ""} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} style={{ borderColor: C.border, minWidth: 160 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button type="button" onClick={async () => { await api.updateSettings({ tagline: settings.tagline }); load(); }} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 rounded-lg">Save</button>
        </div>
      </div>

      <CollapsibleSection tone="blue" title="Color Settings" subtitle="Every color customization in one place — click any one below to open it.">
        <CollapsibleSubSection title="Sidebar &amp; logo strip color" subtitle="Changes everywhere the sidebar and top-left logo strip appear, for everyone who logs in.">
          <div className="flex items-center gap-2 flex-wrap">
            {["#0B1B33", "#0F172A", "#000000", "#185FA5", "#2B6CF6"].map((c) => (
              <button key={c} type="button" onClick={async () => { await api.updateSettings({ sidebarColor: c }); load(); }} style={{ background: c, border: settings.sidebar_color === c ? `2px solid ${C.cyan}` : "2px solid transparent" }} className="w-8 h-8 rounded-full" />
            ))}
            <ColorPickerButton value={settings.sidebar_color || "#0B1B33"} onChange={async (color) => { await api.updateSettings({ sidebarColor: color }); load(); }} />
          </div>
        </CollapsibleSubSection>

        <CollapsibleSubSection title="Loading screen color" subtitle="Shown for a moment every time the app opens, before it knows who's logged in.">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {["#2B6CF6", "#0B1B33", "#FFC93C", "#DC2626", "#FFFFFF"].map((c) => (
              <button key={c} type="button" onClick={async () => { await api.updateSettings({ loadingBackgroundColor: c }); load(); }} style={{ background: c, border: settings.loading_background_color === c ? `2px solid ${C.cyan}` : `2px solid ${C.border}` }} className="w-8 h-8 rounded-full" />
            ))}
            <ColorPickerButton value={settings.loading_background_color || "#2B6CF6"} onChange={async (color) => { await api.updateSettings({ loadingBackgroundColor: color }); load(); }} />
          </div>
        </CollapsibleSubSection>

        <CollapsibleSubSection title="App theme colors" subtitle="Changes every button, link, and highlight across the whole app immediately. Status colors (approved/pending/rejected, low stock) never change.">
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Primary color (buttons, links, active states)</label>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {["#2B6CF6", "#0B1B33", "#185FA5", "#000000", "#DC2626"].map((c) => (
              <button key={c} type="button" onClick={async () => { await api.updateSettings({ themePrimaryColor: c }); load(); }} style={{ background: c, border: settings.theme_primary_color === c ? `2px solid ${C.ink}` : `2px solid ${C.border}` }} className="w-8 h-8 rounded-full" />
            ))}
            <ColorPickerButton value={settings.theme_primary_color || "#2B6CF6"} onChange={async (color) => { await api.updateSettings({ themePrimaryColor: color }); load(); }} />
          </div>
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Accent color (highlights, secondary emphasis)</label>
          <div className="flex items-center gap-2 flex-wrap">
            {["#FFC93C", "#966B00", "#DC2626", "#2B6CF6", "#0B1B33"].map((c) => (
              <button key={c} type="button" onClick={async () => { await api.updateSettings({ themeAccentColor: c }); load(); }} style={{ background: c, border: settings.theme_accent_color === c ? `2px solid ${C.ink}` : `2px solid ${C.border}` }} className="w-8 h-8 rounded-full" />
            ))}
            <ColorPickerButton value={settings.theme_accent_color || "#FFC93C"} onChange={async (color) => { await api.updateSettings({ themeAccentColor: color }); load(); }} />
          </div>
        </CollapsibleSubSection>

        <CollapsibleSubSection title="Top bar color" subtitle="The strip along the top — logo, branch picker, notifications, account. Text and icons automatically switch to stay readable, whatever color is picked.">
          <div className="flex items-center gap-2 flex-wrap">
            {["#FFFFFF", "#0B1B33", "#2B6CF6", "#F5F7FA"].map((c) => (
              <button key={c} type="button" onClick={async () => { await api.updateSettings({ themeTopbarColor: c }); load(); }} style={{ background: c, border: (settings.theme_topbar_color || "#FFFFFF") === c ? `2px solid ${C.cyan}` : `2px solid ${C.border}` }} className="w-8 h-8 rounded-full" />
            ))}
            <ColorPickerButton value={settings.theme_topbar_color || "#FFFFFF"} onChange={async (color) => { await api.updateSettings({ themeTopbarColor: color }); load(); }} />
          </div>
        </CollapsibleSubSection>

        <CollapsibleSubSection title="Big banner &amp; tile style" subtitle="The large dark bands at the top of every page, and similar big tiles like Reports' profit/loss figures — background color, text color, and how visible the softly-drifting background circles are behind the text.">
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Background color</label>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {["#0B1B33", "#2B6CF6", "#000000", "#185FA5", "#7C2D12"].map((c) => (
              <button key={c} type="button" onClick={async () => { await api.updateSettings({ heroBgColor: c }); load(); }} style={{ background: c, border: (settings.hero_bg_color || "#0B1B33") === c ? `2px solid ${C.cyan}` : `2px solid ${C.border}` }} className="w-8 h-8 rounded-full" />
            ))}
            <ColorPickerButton value={settings.hero_bg_color || "#0B1B33"} onChange={async (color) => { await api.updateSettings({ heroBgColor: color }); load(); }} />
          </div>
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Text color</label>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {["#FFFFFF", "#F5F7FA", "#FFC93C"].map((c) => (
              <button key={c} type="button" onClick={async () => { await api.updateSettings({ heroTextColor: c }); load(); }} style={{ background: c, border: (settings.hero_text_color || "#FFFFFF") === c ? `2px solid ${C.cyan}` : `2px solid ${C.border}` }} className="w-8 h-8 rounded-full" />
            ))}
            <ColorPickerButton value={settings.hero_text_color || "#FFFFFF"} onChange={async (color) => { await api.updateSettings({ heroTextColor: color }); load(); }} />
          </div>
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Background circle visibility ({Math.round((settings.hero_bubble_opacity ?? 0.18) * 100)}%)</label>
          <input type="range" min="0" max="60" value={Math.round((settings.hero_bubble_opacity ?? 0.18) * 100)} onChange={async (e) => { await api.updateSettings({ heroBubbleOpacity: Number(e.target.value) / 100 }); load(); }} className="w-full mb-4" style={{ maxWidth: 240 }} />

          <div style={{ borderTop: `1px solid ${C.border}` }} className="pt-4">
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Stat tile colors (Dashboard's four figures, Business Plan, Reports summaries)</label>
            <div style={{ color: C.textSoft }} className="text-xs mb-2">Leave unset to keep each tile's own meaningful color (blue for bookings, green for on-track figures, etc). Set one to apply a single uniform look everywhere instead.</div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {[["#FFC93C", "#0B1B33"], ["#2B6CF6", "#FFFFFF"], ["#0B1B33", "#FFFFFF"]].map(([bg, text]) => (
                <button key={bg} type="button" onClick={async () => { await api.updateSettings({ tileBgColor: bg, tileTextColor: text }); load(); }} style={{ background: bg, border: settings.tile_bg_color === bg ? `2px solid ${C.cyan}` : `2px solid ${C.border}` }} className="w-8 h-8 rounded-full" />
              ))}
              <ColorPickerButton value={settings.tile_bg_color || "#FFC93C"} onChange={async (color) => { await api.updateSettings({ tileBgColor: color, tileTextColor: settings.tile_text_color || "#0B1B33" }); load(); }} />
              {(settings.tile_bg_color || settings.tile_text_color) && (
                <button type="button" onClick={async () => { await api.updateSettings({ tileBgColor: "", tileTextColor: "" }); load(); }} className="text-xs font-semibold ml-1" style={{ color: C.cyan }}>Reset to default</button>
              )}
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Figure text size ({settings.tile_font_size || 22}px)</label>
            <input type="range" min="14" max="30" value={settings.tile_font_size || 22} onChange={async (e) => { await api.updateSettings({ tileFontSize: Number(e.target.value) }); load(); }} className="w-full" style={{ maxWidth: 240 }} />
          </div>

          <div style={{ borderTop: `1px solid ${C.border}` }} className="pt-4 mt-4">
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Dashboard's four tiles — set each one independently</label>
            <div style={{ color: C.textSoft }} className="text-xs mb-3">Same transparent floating-circle look as the page banner above, but each tile keeps its own color, text color, and font size.</div>
            <div className="flex gap-2 flex-wrap mb-3">
              {[["bookings", "Bookings"], ["revenue", "Revenue"], ["activeJobs", "Active Jobs"], ["expenses", "Expenses"]].map(([key, label]) => (
                <button key={key} type="button" onClick={() => setEditingTile(key)} style={{ background: editingTile === key ? C.cyan : "#fff", color: editingTile === key ? "#fff" : C.ink, border: `1px solid ${editingTile === key ? C.cyan : C.border}` }} className="text-xs font-semibold px-3 py-1.5 rounded-lg">{label}</button>
              ))}
            </div>
            {(() => {
              const tileStyles = settings.dashboard_tile_styles || {};
              const current = tileStyles[editingTile] || {};
              const saveTile = async (patch) => {
                const merged = { ...tileStyles, [editingTile]: { ...current, ...patch } };
                await api.updateSettings({ dashboardTileStyles: merged });
                load();
              };
              return (
                <>
                  <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Background</label>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {[["#FFC93C", "#0B1B33"], ["#2B6CF6", "#FFFFFF"], ["#0B1B33", "#FFFFFF"], ["#DC2626", "#FFFFFF"]].map(([bg, text]) => (
                      <button key={bg} type="button" onClick={() => saveTile({ bg, text })} style={{ background: bg, border: current.bg === bg ? `2px solid ${C.cyan}` : `2px solid ${C.border}` }} className="w-8 h-8 rounded-full" />
                    ))}
                    <ColorPickerButton value={current.bg || "#2B6CF6"} onChange={(color) => saveTile({ bg: color })} />
                  </div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Font size ({current.fontSize || 22}px)</label>
                  <input type="range" min="14" max="30" value={current.fontSize || 22} onChange={(e) => saveTile({ fontSize: Number(e.target.value) })} className="w-full mb-2" style={{ maxWidth: 240 }} />
                  {(current.bg || current.text) && (
                    <button type="button" onClick={async () => { await api.updateSettings({ resetDashboardTileKey: editingTile }); load(); }} className="text-xs font-semibold" style={{ color: C.cyan }}>Reset this tile to default</button>
                  )}
                </>
              );
            })()}
          </div>
        </CollapsibleSubSection>

        <CollapsibleSubSection title="App icon background color" subtitle="The color behind your logo when it's used as the installed app icon on a phone or computer. White is the safest default if your logo already has its own white background built in.">
          <div className="flex items-center gap-2 flex-wrap">
            {["#FFFFFF", "#0B1B33", "#F5F7FA", "#FFC93C"].map((c) => (
              <button key={c} type="button" onClick={async () => { await api.updateSettings({ iconBackgroundColor: c }); load(); }} style={{ background: c, border: settings.icon_background_color === c ? `2px solid ${C.cyan}` : `2px solid ${C.border}` }} className="w-8 h-8 rounded-full" />
            ))}
            <ColorPickerButton value={settings.icon_background_color || "#FFFFFF"} onChange={async (color) => { await api.updateSettings({ iconBackgroundColor: color }); load(); }} />
          </div>
          <div style={{ color: C.textSoft }} className="text-xs mt-2">Takes effect the next time the app is installed or reinstalled.</div>
        </CollapsibleSubSection>
      </CollapsibleSection>

      <CollapsibleSection tone="blue" title="Login Page Appearance" subtitle="What everyone sees before they sign in — logo and business name come from above automatically.">
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Welcome message (optional)</label>
        <div className="flex flex-wrap gap-2 mb-4">
          <input value={settings.login_message || ""} onChange={(e) => setSettings({ ...settings, login_message: e.target.value })} placeholder="e.g. Welcome back to Wosha!" style={{ borderColor: C.border, minWidth: 160 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button type="button" onClick={async () => { await api.updateSettings({ loginMessage: settings.login_message }); load(); }} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 rounded-lg">Save</button>
        </div>

        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Background color</label>
        <div style={{ color: C.textSoft }} className="text-xs mb-2">The card in the middle always stays white for readability — this changes the area around it.</div>
        <div className="flex items-center gap-2 flex-wrap">
          {["#0B1B33", "#F5F7FA", "#EAF2FF", "#FFF8E7", "#E6F1FB"].map((c) => (
            <button key={c} type="button" onClick={async () => { await api.updateSettings({ loginBackgroundColor: c }); load(); }} style={{ background: c, border: settings.login_background_color === c ? `2px solid ${C.cyan}` : `2px solid ${C.border}` }} className="w-8 h-8 rounded-full" />
          ))}
          <ColorPickerButton value={settings.login_background_color || "#0B1B33"} onChange={async (color) => { await api.updateSettings({ loginBackgroundColor: color }); load(); }} />
        </div>
      </CollapsibleSection>



      <CollapsibleSection tone="yellow" title="Layout style" subtitle="This is per-device, not shared — switch freely without affecting anyone else's screen. Every page and every feature is exactly the same either way; only how you get around changes.">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { localStorage.setItem("wosha_layout", "sidebar"); window.dispatchEvent(new Event("wosha-layout-change")); }}
            style={{ border: (layoutStyle || "sidebar") === "sidebar" ? `2px solid ${C.cyan}` : `2px solid ${C.border}` }}
            className="rounded-xl p-3 text-left"
          >
            <div className="flex gap-1 mb-2">
              <div style={{ background: C.ink }} className="w-3 h-10 rounded" />
              <div className="flex-1 flex flex-col gap-0.5">
                <div style={{ background: C.border }} className="h-2 rounded" />
                <div style={{ background: C.border }} className="h-2 rounded" />
                <div style={{ background: C.border }} className="h-2 rounded" />
              </div>
            </div>
            <div style={{ color: C.ink }} className="text-xs font-semibold">Sidebar (current)</div>
          </button>
          <button
            type="button"
            onClick={() => { localStorage.setItem("wosha_layout", "grid"); window.dispatchEvent(new Event("wosha-layout-change")); }}
            style={{ border: layoutStyle === "grid" ? `2px solid ${C.cyan}` : `2px solid ${C.border}` }}
            className="rounded-xl p-3 text-left"
          >
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex-1 grid grid-cols-3 gap-0.5">
                <div style={{ background: C.border }} className="h-3 rounded" />
                <div style={{ background: C.border }} className="h-3 rounded" />
                <div style={{ background: C.border }} className="h-3 rounded" />
              </div>
              <div style={{ background: C.ink }} className="h-2.5 rounded mt-1" />
            </div>
            <div style={{ color: C.ink }} className="text-xs font-semibold">Bottom bar + grid</div>
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection tone="blue" title="Icon size &amp; colors" subtitle="Applies to the Home page's quick actions and the grid Menu page. Size is per-device — try one and see how it feels. Colors apply for everyone.">
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Icon size</label>
        <div className="flex gap-2 mb-4">
          {[["normal", "Normal"], ["large", "Large"], ["xlarge", "Extra large"]].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => { localStorage.setItem("wosha_icon_size", key); window.dispatchEvent(new Event("wosha-icon-size-change")); setIconPref((p) => ({ ...p, size: key })); }}
              style={{ background: iconPref.size === key ? C.cyan : "#fff", color: iconPref.size === key ? "#fff" : C.ink, border: `1px solid ${iconPref.size === key ? C.cyan : C.border}` }}
              className="flex-1 text-xs font-semibold py-2 rounded-lg"
            >
              {label}
            </button>
          ))}
        </div>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Columns</label>
        <div className="flex gap-2 mb-4">
          {[[2, "2 columns"], [3, "3 columns"]].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => { localStorage.setItem("wosha_icon_cols", String(key)); window.dispatchEvent(new Event("wosha-icon-size-change")); setIconPref((p) => ({ ...p, cols: key })); }}
              style={{ background: iconPref.cols === key ? C.cyan : "#fff", color: iconPref.cols === key ? "#fff" : C.ink, border: `1px solid ${iconPref.cols === key ? C.cyan : C.border}` }}
              className="flex-1 text-xs font-semibold py-2 rounded-lg"
            >
              {label}
            </button>
          ))}
        </div>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Icon tile background</label>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {["#E6F1FB", "#FAEEDA", "#FFFFFF", "#F5F7FA"].map((c) => (
            <button key={c} type="button" onClick={async () => { await api.updateSettings({ menuIconBgColor: c }); load(); }} style={{ background: c, border: (settings.menu_icon_bg_color || "#E6F1FB") === c ? `2px solid ${C.cyan}` : `2px solid ${C.border}` }} className="w-8 h-8 rounded-full" />
          ))}
          <ColorPickerButton value={settings.menu_icon_bg_color || "#E6F1FB"} onChange={async (color) => { await api.updateSettings({ menuIconBgColor: color }); load(); }} />
        </div>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Icon symbol color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {["#185FA5", "#966B00", "#0B1B33", "#DC2626"].map((c) => (
            <button key={c} type="button" onClick={async () => { await api.updateSettings({ menuIconColor: c }); load(); }} style={{ background: c, border: (settings.menu_icon_color || "#185FA5") === c ? `2px solid ${C.cyan}` : `2px solid ${C.border}` }} className="w-8 h-8 rounded-full" />
          ))}
          <ColorPickerButton value={settings.menu_icon_color || "#185FA5"} onChange={async (color) => { await api.updateSettings({ menuIconColor: color }); load(); }} />
        </div>
      </CollapsibleSection>

      </>
      )}

      {(user?.isPrimaryOwner) && (
        <div className="bg-white rounded-2xl p-6 mb-6 max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <div style={{ color: C.ink }} className="text-sm font-bold">Branches</div>
            <button onClick={() => setBranchFieldsOpen(true)} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Settings2 size={13} /> Manage Branch Info Fields</button>
          </div>
          {branches.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2 flex-wrap py-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 flex-wrap">
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

      {user?.isPrimaryOwner && notifStatus && (
        <CollapsibleSection tone="yellow" title="Email &amp; SMS Delivery" subtitle="Used for password reset codes and supplier quotation emails. Add your SendGrid and Africa's Talking keys to Render's Environment tab (see .env.example for exactly how) to turn these on — until then, these messages just get logged instead of actually sent, and the app works fine either way.">
          <div className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">Email (SendGrid)</span>
            <span style={{ background: notifStatus.emailConfigured ? "#E6F1FB" : "#F1F2F4", color: notifStatus.emailConfigured ? "#185FA5" : C.textSoft }} className="text-xs font-semibold px-3 py-1 rounded-full">{notifStatus.emailConfigured ? "Configured" : "Not configured"}</span>
          </div>
          {notifStatus.emailConfigured && (
            <form onSubmit={runTestEmail} className="flex flex-wrap gap-2 mt-2 mb-1">
              <input required type="email" value={testEmailTo} onChange={(e) => setTestEmailTo(e.target.value)} placeholder="Send a real test to…" style={{ borderColor: C.border, minWidth: 160 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button type="submit" disabled={testBusy} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 rounded-lg disabled:opacity-50">Send Test</button>
            </form>
          )}
          {testEmailMsg && <div style={{ color: testEmailMsg.success ? "#185FA5" : C.danger }} className="text-xs mb-2 flex items-center gap-1">{testEmailMsg.success && <Check size={12} />} {testEmailMsg.text}</div>}

          <div className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">SMS (Africa's Talking)</span>
            <span style={{ background: notifStatus.smsConfigured ? "#E6F1FB" : "#F1F2F4", color: notifStatus.smsConfigured ? "#185FA5" : C.textSoft }} className="text-xs font-semibold px-3 py-1 rounded-full">{notifStatus.smsConfigured ? "Configured" : "Not configured"}</span>
          </div>
          {notifStatus.smsConfigured && (
            <form onSubmit={runTestSms} className="flex flex-wrap gap-2 mt-2 mb-1">
              <input required value={testSmsTo} onChange={(e) => setTestSmsTo(e.target.value)} placeholder="Send a real test to… (+255...)" style={{ borderColor: C.border, minWidth: 160 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button type="submit" disabled={testBusy} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 rounded-lg disabled:opacity-50">Send Test</button>
            </form>
          )}
          {testSmsMsg && <div style={{ color: testSmsMsg.success ? "#185FA5" : C.danger }} className="text-xs flex items-center gap-1">{testSmsMsg.success && <Check size={12} />} {testSmsMsg.text}</div>}
        </CollapsibleSection>
      )}

      {user?.isPrimaryOwner && (
        <CollapsibleSection tone="blue" title="Payment Barcodes" subtitle="Print one, stick it up front — anyone can scan it with their own phone camera to see exactly what's owed and how to pay (no app needed on their end). This shows payment details and your instructions; it doesn't auto-charge a bank or mobile money account — that would require registering with Tanzania's national payment system directly.">
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Payment instructions (shown on the page when someone scans a code)</label>
          <textarea rows={2} defaultValue={settings.payment_instructions || ""} onBlur={async (e) => { await api.updateSettings({ paymentInstructions: e.target.value }); load(); }} placeholder="e.g. Pay via Tigo Pesa: 0712 345 678, or ask staff for a Control Number." style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" />

          {paymentCodes.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 flex-wrap py-2.5" style={{ borderTop: `1px solid ${C.border}`, opacity: c.active ? 1 : 0.5 }}>
              <div>
                <div style={{ color: C.ink }} className="text-sm font-semibold">{c.label}{!c.active && " (disabled)"}</div>
                <div style={{ color: C.textSoft }} className="text-xs">{c.amount ? `TZS ${Number(c.amount).toLocaleString()}` : c.service_name ? "Priced from service" : c.product_name ? "Priced from product" : "Amount shown at scan time"} · code {c.code}</div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setPrintCode(c)} className="text-xs font-semibold" style={{ color: C.cyan }}>View / Print</button>
                <button onClick={() => togglePc(c.id)} className="text-xs font-semibold" style={{ color: C.textSoft }}>{c.active ? "Disable" : "Enable"}</button>
                <button onClick={() => removePc(c.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
              </div>
            </div>
          ))}
          {paymentCodes.length === 0 && <div style={{ color: C.textSoft }} className="text-xs py-2">No payment codes yet.</div>}
          <button onClick={openPcAdd} style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg mt-3">+ Create Payment Code</button>
        </CollapsibleSection>
      )}

      {user?.isPrimaryOwner && (
        <CollapsibleSection tone="yellow" title="Printing" subtitle="Everything related to printed output — header/footer design and the printers themselves — in one place.">
        <CollapsibleSubSection title="Header &amp; Footer Design" subtitle="The header and footer shown automatically on every printed invoice, receipt, and report — sized to stay compact and leave the printable area balanced.">
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: C.ink }} className="text-sm font-semibold">Header</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <span style={{ color: C.textSoft }} className="text-xs">{settings.print_header_enabled !== false ? "On" : "Off"}</span>
              <input type="checkbox" checked={settings.print_header_enabled !== false} onChange={async (e) => { await api.updateSettings({ printHeaderEnabled: e.target.checked }); load(); }} />
            </label>
          </div>
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <label className="flex items-center gap-1.5 text-xs" style={{ color: C.textSoft }}>
              <input type="checkbox" checked={settings.print_header_show_logo !== false} onChange={async (e) => { await api.updateSettings({ printHeaderShowLogo: e.target.checked }); load(); }} /> Show logo
            </label>
            <label className="flex items-center gap-1.5 text-xs" style={{ color: C.textSoft }}>
              <input type="checkbox" checked={settings.print_header_show_slogan !== false} onChange={async (e) => { await api.updateSettings({ printHeaderShowSlogan: e.target.checked }); load(); }} /> Show tagline
            </label>
          </div>
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Header position</label>
          <div className="mb-3" style={{ maxWidth: 200 }}>
            <CustomSelect value={settings.print_header_align || "left"} onChange={async (v) => { await api.updateSettings({ printHeaderAlign: v }); load(); }} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} />
          </div>
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Header text size ({settings.print_header_font_size || 12}px)</label>
          <input type="range" min="8" max="20" value={settings.print_header_font_size || 12} onChange={async (e) => { await api.updateSettings({ printHeaderFontSize: Number(e.target.value) }); load(); }} className="w-full mb-3" style={{ maxWidth: 200 }} />

          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Or use your own design (image or Word doc)</label>
          <div style={{ color: C.textSoft }} className="text-xs mb-2">Replaces the logo/name above — scales automatically to fit.</div>
          {settings.print_header_attachment_type ? (
            <div className="flex items-center gap-3 mb-5">
              <span style={{ color: "#185FA5" }} className="text-xs font-semibold">✓ Custom {settings.print_header_attachment_type === "image" ? "image" : "document"} attached</span>
              <button type="button" onClick={() => clearPrintAttachment("header")} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
            </div>
          ) : (
            <label className="mb-5 block">
              <input type="file" accept="image/*,.docx" className="hidden" disabled={attachmentBusy.header} onChange={(e) => uploadPrintAttachment("header", e.target.files[0])} />
              <span style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-3 py-2 rounded-lg inline-block cursor-pointer">{attachmentBusy.header ? "Uploading…" : "Upload image or .docx"}</span>
            </label>
          )}

          <div className="flex items-center justify-between mb-3">
            <span style={{ color: C.ink }} className="text-sm font-semibold">Footer</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <span style={{ color: C.textSoft }} className="text-xs">{settings.print_footer_enabled !== false ? "On" : "Off"}</span>
              <input type="checkbox" checked={settings.print_footer_enabled !== false} onChange={async (e) => { await api.updateSettings({ printFooterEnabled: e.target.checked }); load(); }} />
            </label>
          </div>
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Footer text (address, phone, website — one per line)</label>
          <textarea rows={3} defaultValue={settings.print_footer_text || ""} onBlur={async (e) => { await api.updateSettings({ printFooterText: e.target.value }); load(); }} placeholder={"123 Uhuru St, Dar es Salaam\n+255 712 345 678 · info@wosha.com"} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Footer position</label>
          <div className="mb-3" style={{ maxWidth: 200 }}>
            <CustomSelect value={settings.print_footer_align || "center"} onChange={async (v) => { await api.updateSettings({ printFooterAlign: v }); load(); }} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} />
          </div>
          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Footer text size ({settings.print_footer_font_size || 10}px)</label>
          <input type="range" min="7" max="16" value={settings.print_footer_font_size || 10} onChange={async (e) => { await api.updateSettings({ printFooterFontSize: Number(e.target.value) }); load(); }} className="w-full mb-3" style={{ maxWidth: 200 }} />

          <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Or use your own design (image or Word doc)</label>
          <div style={{ color: C.textSoft }} className="text-xs mb-2">Replaces the footer text above — scales automatically to fit.</div>
          {settings.print_footer_attachment_type ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span style={{ color: "#185FA5" }} className="text-xs font-semibold">✓ Custom {settings.print_footer_attachment_type === "image" ? "image" : "document"} attached</span>
              <button type="button" onClick={() => clearPrintAttachment("footer")} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
            </div>
          ) : (
            <label className="block">
              <input type="file" accept="image/*,.docx" className="hidden" disabled={attachmentBusy.footer} onChange={(e) => uploadPrintAttachment("footer", e.target.files[0])} />
              <span style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-3 py-2 rounded-lg inline-block cursor-pointer">{attachmentBusy.footer ? "Uploading…" : "Upload image or .docx"}</span>
            </label>
          )}
        </CollapsibleSubSection>

        <CollapsibleSubSection title="Printer Profiles" subtitle="Set up each printer once — paper size, how it connects, and preview how a receipt will actually look on it before printing for real.">
          {printers.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 flex-wrap py-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <span style={{ color: C.ink }} className="text-sm">{p.name} — {p.paper_size} {p.connection && p.connection !== "usb" ? `· ${p.connection}` : ""} {p.is_default ? "(default)" : ""}</span>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setPreviewPrinter(p)} className="text-xs font-semibold" style={{ color: C.cyan }}>Preview</button>
                {!p.is_default && <button onClick={() => setDefault(p.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>Set Default</button>}
                <button onClick={() => removePrinter(p.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
              </div>
            </div>
          ))}
          <form onSubmit={addPrinter} className="flex flex-col gap-2 mt-3">
            <div className="flex flex-wrap gap-2">
              <input placeholder="Name" value={printerForm.name} onChange={(e) => setPrinterForm({ ...printerForm, name: e.target.value })} style={{ borderColor: C.border, minWidth: 140 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <div style={{ width: 120 }}>
                <CustomSelect value={printerForm.paperSize} onChange={(v) => setPrinterForm({ ...printerForm, paperSize: v })} options={["58mm", "76mm", "80mm", "A5", "A4", "Letter"].map((p) => ({ value: p, label: p }))} className="w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between" style={{ borderColor: C.border }} />
              </div>
            </div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Connection</label>
            <div className="flex gap-2 flex-wrap">
              {[["usb", "USB / Wired"], ["network", "Network (WiFi)"], ["bluetooth", "Bluetooth"]].map(([key, label]) => (
                <button key={key} type="button" onClick={() => setPrinterForm({ ...printerForm, connection: key })} style={{ background: printerForm.connection === key ? C.cyan : "#fff", color: printerForm.connection === key ? "#fff" : C.ink, border: `1px solid ${printerForm.connection === key ? C.cyan : C.border}` }} className="text-xs font-semibold px-3 py-1.5 rounded-lg">{label}</button>
              ))}
            </div>
            {printerForm.connection === "network" && (
              <div>
                <input value={printerForm.networkAddress || ""} onChange={(e) => setPrinterForm({ ...printerForm, networkAddress: e.target.value })} placeholder="Printer IP address or network name (optional)" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 text-sm mb-1" />
                <div style={{ color: C.textSoft }} className="text-xs">WiFi printers print through your device's own system print dialog — set the printer up once in your phone or computer's own settings, and it'll appear as a normal option when printing. This field just labels which one this profile refers to.</div>
              </div>
            )}
            {printerForm.connection === "bluetooth" && (
              <div>
                <button type="button" onClick={pairBluetoothPrinter} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="text-xs font-semibold px-3 py-2 rounded-lg mb-1">
                  {printerForm.bluetoothName ? `Paired: ${printerForm.bluetoothName}` : "Pair a Bluetooth printer"}
                </button>
                <div style={{ color: C.textSoft }} className="text-xs">{bluetoothSupportMsg || "Opens your browser's own Bluetooth device picker to find and remember a nearby printer. Supported on Chrome (desktop and Android); not available in Safari or iOS."}</div>
              </div>
            )}
            <Button type="submit" className="self-start">Add printer</Button>
          </form>
        </CollapsibleSubSection>
        </CollapsibleSection>
      )}

      {user?.isPrimaryOwner && (
        <CollapsibleSection tone="blue" title="Backup &amp; Restore" subtitle="Download a full backup of every record in the system (customers, bookings, invoices, staff, settings — everything except passwords) as a JSON file you can store or send to the backend.">
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={doExport} disabled={backupBusy} style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50" >⧉ Export All Data (JSON)</button>
            <button onClick={() => restoreFileRef.current?.click()} disabled={backupBusy} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="flex-1 text-sm font-semibold py-2 rounded-lg disabled:opacity-50" >Restore from Backup File…</button>
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
          {backupMsg && <div style={{ color: backupMsg.includes("couldn't") || backupMsg.includes("fail") ? C.danger : "#185FA5" }} className="text-xs mt-3">{backupMsg}</div>}
        </CollapsibleSection>
      )}

      {user?.isPrimaryOwner && (
        <CollapsibleSection tone="yellow" title="Account security" subtitle="Every account is protected against password-guessing attacks: after 5 failed login attempts, that account locks for 15 minutes automatically. Passwords are never stored in plain text (hashed with a unique salt per account), and export/backup files never contain password data.">
          <div style={{ color: C.textSoft }} className="text-xs">This section is informational — there's nothing to configure here, since these protections are always on for every account.</div>
        </CollapsibleSection>
      )}

      {user?.isPrimaryOwner && (
        <CollapsibleSection tone="blue" title="General Manager Accounts" subtitle="A General Manager sees and does everything you can — every branch, every module, no restrictions. You can pause their access at any time and pick everything back up yourself, then resume them whenever you're ready. Only your account (the original owner) can see this section.">
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
                  : <button onClick={() => reactivateGm(gm.id)} className="text-xs font-semibold" style={{ color: "#185FA5" }}>Resume</button>}
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
              <PasswordInput required value={gmForm.password} onChange={(e) => setGmForm({ ...gmForm, password: e.target.value })} className="mb-2" />
              <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Email (optional)</label>
              <input value={gmForm.email} onChange={(e) => setGmForm({ ...gmForm, email: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setGmOpen(false)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Cancel</button>
                <button type="submit" style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Create Account</button>
              </div>
            </form>
          )}
        </CollapsibleSection>
      )}

      <CollapsibleSection tone="yellow" title="Change Password">
        <form onSubmit={changePw}>
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Current password</label>
        <PasswordInput value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="mb-3" />
        <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>New password</label>
        <PasswordInput value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} className="mb-3" />
        <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 py-2 rounded-lg">Update Password</button>
        {pwMsg && <span style={{ color: pwMsg.includes("changed") ? "#185FA5" : C.danger }} className="text-xs ml-3">{pwMsg}</span>}
        </form>
      </CollapsibleSection>

      <Modal open={!!previewPrinter} onClose={() => setPreviewPrinter(null)}>
        {previewPrinter && (() => {
          const widths = { "58mm": 200, "76mm": 260, "80mm": 280, A5: 380, A4: 480, Letter: 480 };
          return (
            <>
              <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-1">Preview — {previewPrinter.name}</div>
              <div style={{ color: C.textSoft }} className="text-xs mb-4">Roughly how a receipt looks on {previewPrinter.paper_size} paper. Real spacing depends on the printer itself.</div>
              <div className="flex justify-center">
                <div style={{ background: "#fff", border: `1px solid ${C.border}`, width: widths[previewPrinter.paper_size] || 280, fontSize: 11 }} className="p-3 max-h-[50vh] overflow-y-auto">
                  <PrintHeader />
                  <div style={{ color: C.ink }} className="font-bold mb-2">Sample Receipt</div>
                  <div className="flex justify-between mb-1"><span>Exterior Wash</span><span>TZS 15,000</span></div>
                  <div className="flex justify-between mb-1"><span>Interior Vacuum</span><span>TZS 8,000</span></div>
                  <div className="flex justify-between font-bold pt-1 mb-2" style={{ borderTop: `1px solid ${C.border}` }}><span>Total</span><span>TZS 23,000</span></div>
                  <PrintFooter />
                </div>
              </div>
              <Button variant="ghost" onClick={() => setPreviewPrinter(null)} className="w-full mt-4">Close</Button>
            </>
          );
        })()}
      </Modal>

      <CollapsibleSection tone="yellow" title="Custom Customer Fields" subtitle="Add extra fields you want to capture for every customer — they'll show up on the Add Customer form.">
        {customFields.map((f) => (
          <div key={f.id} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">{f.field_name}</span>
            <button onClick={() => removeField(f.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
          </div>
        ))}
        {customFields.length === 0 && <div style={{ color: C.textSoft }} className="text-xs py-2">No custom fields yet.</div>}
        <form onSubmit={addField} className="flex flex-wrap gap-2 mt-3">
          <input placeholder="e.g. Loyalty Card Number" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} style={{ borderColor: C.border, minWidth: 160 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 rounded-lg">Add</button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection tone="blue" title="Messaging &amp; Attachments" subtitle="Turn attachments off by default to save storage, and allow specific people when needed.">

        <div className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <span style={{ color: C.ink }} className="text-sm">Staff attachments (Team Chat) — allowed by default</span>
          <button onClick={() => toggleGlobalAttachments("staffAttachmentsEnabled", !settings.staff_attachments_enabled)} style={{ background: settings.staff_attachments_enabled ? "#185FA5" : C.border, color: settings.staff_attachments_enabled ? "#fff" : C.textSoft }} className="text-xs font-semibold px-3 py-1 rounded-full shrink-0">{settings.staff_attachments_enabled ? "On" : "Off"}</button>
        </div>
        <div className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <span style={{ color: C.ink }} className="text-sm">Client attachments (Client Messages) — allowed by default</span>
          <button onClick={() => toggleGlobalAttachments("clientAttachmentsEnabled", !settings.client_attachments_enabled)} style={{ background: settings.client_attachments_enabled ? "#185FA5" : C.border, color: settings.client_attachments_enabled ? "#fff" : C.textSoft }} className="text-xs font-semibold px-3 py-1 rounded-full shrink-0">{settings.client_attachments_enabled ? "On" : "Off"}</button>
        </div>

        <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mt-4 mb-2">Staff exceptions (override the default above)</div>
        {staffOverrides.map((o) => (
          <div key={o.id} className="flex items-center justify-between py-1.5">
            <span style={{ color: C.ink }} className="text-sm">{o.person_name} — {o.allowed ? "allowed" : "blocked"}</span>
            <button onClick={() => removeOverride(o.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
          </div>
        ))}
        <form onSubmit={addStaffOverride} className="mt-2">
          <div className="mb-2">
            <CustomSelect value={staffOverridePick} onChange={setStaffOverridePick} placeholder="Choose a staff member…" options={staffList.map((s) => ({ value: s.id, label: s.name }))} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between" style={{ borderColor: C.border }} />
          </div>
          <div className="flex gap-2">
            <div style={{ width: 100 }}>
              <CustomSelect value={String(staffOverrideAllow)} onChange={(v) => setStaffOverrideAllow(v === "true")} options={[{ value: "true", label: "Allow" }, { value: "false", label: "Block" }]} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between" style={{ borderColor: C.border }} />
            </div>
            <button type="submit" style={{ background: C.cyan }} className="text-white text-xs font-semibold px-3 rounded-lg">Set</button>
          </div>
        </form>

        <div style={{ color: C.textSoft }} className="text-xs font-semibold uppercase mt-4 mb-2">Client exceptions (override the default above)</div>
        {clientOverrides.map((o) => (
          <div key={o.id} className="flex items-center justify-between py-1.5">
            <span style={{ color: C.ink }} className="text-sm">{o.person_name} — {o.allowed ? "allowed" : "blocked"}</span>
            <button onClick={() => removeOverride(o.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
          </div>
        ))}
        <form onSubmit={addClientOverride} className="mt-2">
          <div className="mb-2">
            <CustomSelect value={clientOverridePick} onChange={setClientOverridePick} placeholder="Choose a customer…" options={customerList.map((c) => ({ value: c.id, label: c.name }))} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between" style={{ borderColor: C.border }} />
          </div>
          <div className="flex gap-2">
            <div style={{ width: 100 }}>
              <CustomSelect value={String(clientOverrideAllow)} onChange={(v) => setClientOverrideAllow(v === "true")} options={[{ value: "true", label: "Allow" }, { value: "false", label: "Block" }]} className="w-full border rounded-lg px-2 py-1.5 text-xs text-left flex items-center justify-between" style={{ borderColor: C.border }} />
            </div>
            <button type="submit" style={{ background: C.cyan }} className="text-white text-xs font-semibold px-3 rounded-lg">Set</button>
          </div>
        </form>
      </CollapsibleSection>

      <CollapsibleSection tone="yellow" title="Notifications" subtitle="Turn off any category you don't want appearing in the reminders bell.">
        {notifPrefs.filter((n) => !n.is_custom).map((n) => (
          <div key={n.id} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">{n.category}</span>
            <button onClick={() => toggleNotif(n.id)} style={{ background: n.enabled ? "#185FA5" : C.border, color: n.enabled ? "#fff" : C.textSoft }} className="text-xs font-semibold px-3 py-1 rounded-full">{n.enabled ? "On" : "Off"}</button>
          </div>
        ))}
        <div style={{ color: C.textSoft }} className="text-xs mt-4 mb-2">Custom categories (informational only — no automatic alerts)</div>
        {notifPrefs.filter((n) => n.is_custom).map((n) => (
          <div key={n.id} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.ink }} className="text-sm">{n.category}</span>
            <button onClick={() => removeCategory(n.id)} className="text-xs font-semibold" style={{ color: C.danger }}>Remove</button>
          </div>
        ))}
        <form onSubmit={addCategory} className="flex flex-wrap gap-2 mt-3">
          <input placeholder="e.g. Birthday Reminders" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ borderColor: C.border, minWidth: 160 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 rounded-lg">Add Category</button>
        </form>
      </CollapsibleSection>

      <CollapsibleSection tone="blue" title="Category List" subtitle="Every dropdown in the app (services, products, expenses, purchase orders, client segments, cash flow, and more) pulls from these lists — add or remove options here and they show up everywhere immediately.">
        <CategoryManager type="service" title="Service Categories" />
        <CategoryManager type="product" title="Product Categories" />
        <CategoryManager type="supplier" title="Supplier Categories" />
        <CategoryManager type="expense" title="Expense Categories" />
        <CategoryManager type="purchase_order" title="Purchase Order Categories" />
        <CategoryManager type="client_segment" title="Client Segments / Tags" />
        <CategoryManager type="cashflow" title="Cash Flow Categories" />
        <CategoryManager type="task_template" title="Task Templates (Compliance & Tasks)" />
        <CategoryManager type="branch_target" title="Branch Target Categories" />
      </CollapsibleSection>

      <CollapsibleSection tone="yellow" title="Purchase Order Catalog" subtitle="Pre-defined items staff can tap to add when building a purchase order, organized by category.">
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
          <div className="flex flex-wrap gap-2">
            <input placeholder="Item name" value={catalogForm.name} onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })} style={{ borderColor: C.border, minWidth: 140 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Spec (optional)" value={catalogForm.spec} onChange={(e) => setCatalogForm({ ...catalogForm, spec: e.target.value })} style={{ borderColor: C.border, minWidth: 140 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button style={{ background: C.cyan }} className="text-white text-sm font-semibold px-3 py-2 rounded-lg">Add to Catalog</button>
        </form>
      </CollapsibleSection>

      {branchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,27,51,0.45)" }}>
          <form onSubmit={saveBranch} style={{ background: "#fff" }} className="w-full max-w-sm rounded-xl p-6">
            <div style={{ color: C.ink }} className="text-lg font-bold mb-4">{branchEditing ? "Edit Branch" : "Add Branch"}</div>
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Branch name</label>
            <input required value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
            <label className="text-xs font-semibold block mb-1" style={{ color: C.textSoft }}>Color</label>
            <ColorPickerButton wide value={branchForm.color} onChange={(color) => setBranchForm({ ...branchForm, color })} />
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
            <form onSubmit={addBranchField} className="flex flex-wrap gap-2 mt-3">
              <input placeholder="e.g. Address" value={newBranchFieldName} onChange={(e) => setNewBranchFieldName(e.target.value)} style={{ borderColor: C.border, minWidth: 160 }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button type="submit" style={{ background: C.cyan }} className="text-white text-sm font-semibold px-4 rounded-lg">+ Add Field</button>
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
            {settings.tagline && <div style={{ color: C.textSoft }} className="text-xs mb-2">{settings.tagline}</div>}
            <div style={{ color: C.ink }} className="text-sm font-semibold mb-4">{printCode.label}</div>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={`${window.location.origin}/pay/${printCode.code}`} size={200} level="M" />
            </div>
            {printCode.amount && <div style={{ color: C.ink }} className="text-lg font-bold mb-1">TZS {Number(printCode.amount).toLocaleString()}</div>}
            <div style={{ color: C.textSoft }} className="text-xs mb-4">Scan with any phone camera to see how to pay</div>
            <PrintFooter />
            <div className="wosha-no-print flex gap-2 mt-2">
              <button onClick={() => setPrintCode(null)} className="flex-1 text-sm font-semibold py-2 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.ink }}>Close</button>
              <button onClick={() => window.print()} style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Print</button>
            </div>
          </div>
        </div>
      )}
      {/* ---------- Public website content ---------- */}
      <CollapsibleSection tone="yellow" title="Public website content" subtitle={<>Everything visible on the public marketing site — testimonials, photo/video gallery, hero text, and which sections show — managed here, no code required. {siteVisitCount != null && <>The site has had <strong style={{ color: C.ink }}>{siteVisitCount.toLocaleString()}</strong> real visits.</>}</>}>

      <div className="bg-white rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div style={{ color: C.ink }} className="text-sm font-semibold flex items-center gap-1.5"><Star size={15} color="#966B00" /> Testimonials</div>
          <button onClick={() => setTestimonialOpen(true)} className="text-xs font-semibold" style={{ color: C.cyan }}>+ Add testimonial</button>
        </div>
        {testimonials.length === 0 && <div style={{ color: C.textSoft }} className="text-xs">None yet — add your first one so it shows on the website.</div>}
        <div className="flex flex-col gap-2">
          {testimonials.map((t) => (
            <div key={t.id} style={{ background: "#F5F7FA", opacity: t.visible ? 1 : 0.5 }} className="rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <span style={{ color: C.ink }} className="text-xs font-semibold">{t.customer_name} {"★".repeat(t.rating)}{t.visible === false ? " (hidden)" : ""}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleTestimonialVisible(t.id)} className="text-xs font-semibold" style={{ color: C.cyan }}>{t.visible ? "Hide" : "Show"}</button>
                  <button onClick={() => removeTestimonialItem(t.id)} style={{ color: C.danger }}><X size={13} /></button>
                </div>
              </div>
              <div style={{ color: C.textSoft }} className="text-xs mt-1">"{t.quote}"</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div style={{ color: C.ink }} className="text-sm font-semibold flex items-center gap-1.5"><ImageIcon size={15} color="#185FA5" /> Photo & video gallery</div>
          <button onClick={() => setGalleryOpen(true)} className="text-xs font-semibold" style={{ color: C.cyan }}>+ Add media</button>
        </div>
        {galleryItems.length === 0 && <div style={{ color: C.textSoft }} className="text-xs">None yet — add washing/detailing photos or clips to show on the website.</div>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {galleryItems.map((g) => (
            <div key={g.id} style={{ opacity: g.visible ? 1 : 0.5 }} className="relative rounded-lg overflow-hidden" >
              {g.media_type === "video"
                ? <video src={g.media_url} className="w-full h-24 object-cover" />
                : <img src={g.media_url} alt="" className="w-full h-24 object-cover" />}
              <div className="absolute inset-0 flex items-end justify-between p-1.5" style={{ background: "linear-gradient(to top, rgba(11,27,51,0.6), transparent 50%)" }}>
                <span className="text-white text-[10px] font-medium truncate">{g.title || (g.media_type === "video" ? "Video" : "Photo")}</span>
                <div className="flex gap-1">
                  <button onClick={() => toggleGalleryVisible(g.id)} className="text-white text-[10px] font-semibold">{g.visible ? "Hide" : "Show"}</button>
                  <button onClick={() => removeGalleryItem(g.id)} className="text-white"><X size={11} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={saveWebsiteContent} className="bg-white rounded-2xl p-5">
        <div style={{ color: C.ink }} className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Globe size={15} color={C.cyan} /> Site language, hero text & sections</div>
        {!user?.isPrimaryOwner && <div style={{ background: "#FAEEDA", color: "#854F0B" }} className="rounded-lg px-3 py-2 text-xs mb-3">Only the primary owner can save these — you can still review them here.</div>}
        <FieldLabel>Default language for visitors</FieldLabel>
        <div className="mb-3">
          <CustomSelect disabled={!user?.isPrimaryOwner} value={websiteContentForm.defaultLanguage} onChange={(v) => setWebsiteContentForm({ ...websiteContentForm, defaultLanguage: v })} options={[{ value: "en", label: "English" }, { value: "sw", label: "Kiswahili" }, { value: "fr", label: "Français" }]} />
        </div>
        <FieldLabel>Hero headline override (optional — leave blank to use the default)</FieldLabel>
        <input disabled={!user?.isPrimaryOwner} value={websiteContentForm.heroHeadline} onChange={(e) => setWebsiteContentForm({ ...websiteContentForm, heroHeadline: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm disabled:opacity-60" />
        <FieldLabel>Hero subheadline override (optional)</FieldLabel>
        <input disabled={!user?.isPrimaryOwner} value={websiteContentForm.heroSubheadline} onChange={(e) => setWebsiteContentForm({ ...websiteContentForm, heroSubheadline: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-4 text-sm disabled:opacity-60" />
        <div className="flex flex-col gap-2 mb-4">
          {[["showStats", "Show the stats strip (branches, services, turnaround)"], ["showTestimonials", "Show the testimonials section"], ["showGallery", "Show the photo & video gallery"]].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm" style={{ color: C.ink }}>
              <input disabled={!user?.isPrimaryOwner} type="checkbox" checked={websiteContentForm[key]} onChange={(e) => setWebsiteContentForm({ ...websiteContentForm, [key]: e.target.checked })} /> {label}
            </label>
          ))}
        </div>
        {user?.isPrimaryOwner && (
          <div className="flex items-center gap-3">
            <Button type="submit">Save website content</Button>
            {websiteSavedMsg && <span style={{ color: "#185FA5" }} className="text-xs">{websiteSavedMsg}</span>}
          </div>
        )}
      </form>
      </CollapsibleSection>

      <Modal open={testimonialOpen} onClose={() => setTestimonialOpen(false)}>
        <form onSubmit={submitTestimonial}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Add testimonial</div>
          <FieldLabel>Customer name</FieldLabel>
          <input required value={testimonialForm.customerName} onChange={(e) => setTestimonialForm({ ...testimonialForm, customerName: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Quote</FieldLabel>
          <textarea required rows={3} value={testimonialForm.quote} onChange={(e) => setTestimonialForm({ ...testimonialForm, quote: e.target.value })} style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>Rating</FieldLabel>
          <div className="mb-4">
            <CustomSelect value={String(testimonialForm.rating)} onChange={(v) => setTestimonialForm({ ...testimonialForm, rating: Number(v) })} options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: "★".repeat(n) }))} />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setTestimonialOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Add</Button>
          </div>
        </form>
      </Modal>

      <Modal open={galleryOpen} onClose={() => setGalleryOpen(false)}>
        <form onSubmit={submitGalleryItem}>
          <div style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold mb-4">Add photo or video</div>
          <FieldLabel>Title (optional)</FieldLabel>
          <input value={galleryForm.title} onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })} placeholder="e.g. Full interior detail" style={{ borderColor: C.border }} className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" />
          <FieldLabel>File</FieldLabel>
          <div className="mb-4">
            <FileDropzone accept="image/*,video/*" maxSizeMb={20} label="Drop a photo or video clip here" onUploaded={(f) => setGalleryForm({ ...galleryForm, mediaUrl: f.url, mediaType: f.name?.match(/\.(mp4|mov|webm)$/i) ? "video" : "image" })} />
            {galleryForm.mediaUrl && <div style={{ color: "#185FA5" }} className="text-xs mt-1">Attached — ready to add.</div>}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setGalleryOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={!galleryForm.mediaUrl} className="flex-1">Add</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
