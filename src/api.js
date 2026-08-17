const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export const API_BASE_URL_FOR_DISPLAY = BASE_URL;

// If this deployed build is still pointing at a local dev address, no amount of
// waiting will ever fix it — it's not a slow connection, it's trying to reach a
// server that doesn't exist from wherever the phone actually is. This is the
// single most common real cause of "the app never opens" after a deploy: the
// VITE_API_URL environment variable was never set (or got lost) in Vercel. Export
// it so the boot screen can show this immediately, with zero waiting.
export const MISCONFIGURED_API_URL = import.meta.env.PROD && BASE_URL.includes("localhost");

function getToken() {
  return localStorage.getItem("wosha_token");
}
export function setToken(token) {
  if (token) localStorage.setItem("wosha_token", token);
  else localStorage.removeItem("wosha_token");
}

// A hosted backend on a free/sleeping tier can take 30-60+ seconds to wake up from
// a cold start — without a timeout, a plain fetch() just hangs with zero feedback,
// which looks exactly like "the app is broken" rather than "the server is waking
// up." This covers the ENTIRE request — not just until response headers arrive,
// but through reading the full response body too. A timeout that only wrapped the
// initial fetch() call would still hang forever if headers came back but the body
// then stalled mid-stream, which is exactly the kind of half-alive state a waking
// server or a shaky mobile connection can produce.
async function request(path, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  let timedOut = false;

  const attempt = (async () => {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      cache: "no-store", // mobile browsers can silently cache GET responses — this forces every request to actually hit the server
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || "Something went wrong.");
      err.status = res.status;
      throw err;
    }
    return data;
  })();

  const deadline = new Promise((_, reject) => {
    setTimeout(() => { timedOut = true; controller.abort(); reject(new Error("TIMEOUT")); }, timeoutMs);
  });

  try {
    return await Promise.race([attempt, deadline]);
  } catch (err) {
    if (timedOut || err.name === "AbortError") throw new Error("TIMEOUT");
    if (err.message) throw err;
    throw new Error("Couldn't reach the server — check your connection.");
  }
}

// Used only for the very first request on app boot (checking who's logged in),
// where a cold backend is most likely to be hit. One retry with a much longer
// window rides out a real cold start instead of giving up after 12 seconds.
export async function requestWithColdStartRetry(path) {
  try {
    return await request(path, {}, 12000);
  } catch (err) {
    if (err.message !== "TIMEOUT") throw err;
    return await request(path, {}, 45000);
  }
}

// Same as request(), but also reads the X-Total-Count header for pages that need to
// show "showing 200 of 1,400" and a Load More button, without changing the response
// shape (and therefore behavior) for every other page that just expects a plain array.
async function requestWithCount(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
  });
  const data = await res.json().catch(() => ([]));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  const total = Number(res.headers.get("X-Total-Count") ?? data.length);
  return { rows: data, total };
}

export const api = {
  login: (username, password, allowedRoles) => request("/auth/login", { method: "POST", body: { username, password, allowedRoles } }),
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  guestBookingRequest: (payload) => request("/bookings/guest-request", { method: "POST", body: payload }),
  getPublicServices: () => request("/services/public"),
  getPublicBranches: () => request("/locations/public"),
  me: () => request("/auth/me"),
  meWithRetry: () => requestWithColdStartRetry("/auth/me"),
  updateProfile: (payload) => request("/auth/profile", { method: "PUT", body: payload }),
  changePassword: (currentPassword, newPassword) => request("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }),
  forgotPasswordRequest: (identifier) => request("/auth/forgot-password/request", { method: "POST", body: { identifier } }),
  forgotPasswordVerify: (username, code, newPassword) => request("/auth/forgot-password/verify", { method: "POST", body: { username, code, newPassword } }),

  getLocations: () => request("/locations"),
  addLocation: (payload) => request("/locations", { method: "POST", body: payload }),

  getCustomers: () => request("/customers"),
  searchCustomersPaged: (search, offset) => requestWithCount(`/customers?limit=50&offset=${offset || 0}${search ? `&search=${encodeURIComponent(search)}` : ""}`),
  addCustomer: (payload) => request("/customers", { method: "POST", body: payload }),
  addVehicle: (customerId, payload) => request(`/customers/${customerId}/vehicles`, { method: "POST", body: payload }),
  getCustomerByPlate: (plate) => request(`/customers/by-plate/${encodeURIComponent(plate)}`),
  findOrCreateCustomerByPlate: (plate) => request("/customers/find-or-create-by-plate", { method: "POST", body: { plate } }),
  getCustomer: (id) => request(`/customers/${id}`),
  updateCustomer: (id, payload) => request(`/customers/${id}`, { method: "PUT", body: payload }),

  getServices: () => request("/services"),
  addService: (payload) => request("/services", { method: "POST", body: payload }),
  updateService: (id, payload) => request(`/services/${id}`, { method: "PUT", body: payload }),
  removeService: (id) => request(`/services/${id}`, { method: "DELETE" }),

  getReminders: () => request("/reminders"),

  getGeneralManagers: () => request("/general-managers"),
  exportBackup: () => request("/backup/export"),
  restoreBackup: (tables) => request("/backup/restore", { method: "POST", body: { tables } }),
  saveQuickRestorePoint: () => request("/backup/quick-point", { method: "POST" }),
  getQuickRestorePointInfo: () => request("/backup/quick-point"),
  restoreQuickPoint: () => request("/backup/quick-point/restore", { method: "POST" }),

  getMessageTemplates: () => request("/message-templates"),

  requestRestock: (productId, note) => request(`/products/${productId}/request-restock`, { method: "POST", body: { note } }),
  getOpenRestockRequests: () => request("/products/restock-requests/open"),
  fulfillRestockRequest: (id) => request(`/products/restock-requests/${id}/fulfill`, { method: "PATCH" }),

  getIncomingPayments: (status) => request(`/incoming-payments${status ? `?status=${status}` : ""}`),
  logIncomingPayment: (payload) => request("/incoming-payments", { method: "POST", body: payload }),
  confirmIncomingPayment: (id) => request(`/incoming-payments/${id}/confirm`, { method: "PATCH" }),
  removeIncomingPayment: (id) => request(`/incoming-payments/${id}`, { method: "DELETE" }),

  getSupplierPayments: (supplierId) => request(`/supplier-payments${supplierId ? `?supplierId=${supplierId}` : ""}`),
  addSupplierPayment: (payload) => request("/supplier-payments", { method: "POST", body: payload }),
  markSupplierPaymentDownloaded: (id, savedLocationNote) => request(`/supplier-payments/${id}/mark-downloaded`, { method: "PATCH", body: { savedLocationNote } }),

  getPaymentCodes: () => request("/payment-codes"),
  addPaymentCode: (payload) => request("/payment-codes", { method: "POST", body: payload }),
  togglePaymentCode: (id) => request(`/payment-codes/${id}/toggle`, { method: "PATCH" }),
  removePaymentCode: (id) => request(`/payment-codes/${id}`, { method: "DELETE" }),
  lookupPaymentCode: (code) => request(`/payment-codes/lookup/${code}`),
  getPublicPaymentCode: (code) => request(`/payment-codes/public/${code}`),
  addMessageTemplate: (payload) => request("/message-templates", { method: "POST", body: payload }),
  removeMessageTemplate: (id) => request(`/message-templates/${id}`, { method: "DELETE" }),
  addGeneralManager: (payload) => request("/general-managers", { method: "POST", body: payload }),
  deactivateGeneralManager: (id) => request(`/general-managers/${id}/deactivate`, { method: "PATCH" }),
  reactivateGeneralManager: (id) => request(`/general-managers/${id}/reactivate`, { method: "PATCH" }),
  removeGeneralManager: (id) => request(`/general-managers/${id}`, { method: "DELETE" }),

  getSettings: () => request("/settings"),
  uploadPrintAttachment: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/upload/print-attachment`, {
      method: "POST",
      headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed.");
    return data; // { type: 'image'|'docx', url?, html? }
  },
  setPrintAttachment: (slot, payload) => request(`/settings/print-attachment/${slot}`, { method: "PUT", body: payload }),
  clearPrintAttachment: (slot) => request(`/settings/print-attachment/${slot}`, { method: "PUT", body: {} }),
  getPublicSettings: () => request("/settings/public"),
  updateSettings: (payload) => request("/settings", { method: "PUT", body: payload }),
  getNotificationStatus: () => request("/settings/notification-status"),
  testEmail: (to) => request("/settings/test-email", { method: "POST", body: { to } }),
  testSms: (to) => request("/settings/test-sms", { method: "POST", body: { to } }),

  checkAttachmentPermission: (scope, personId) => request(`/attachment-permissions/check?scope=${scope}${personId ? `&personId=${personId}` : ""}`),
  getAttachmentOverrides: (scope) => request(`/attachment-permissions?scope=${scope}`),
  setAttachmentOverride: (scope, personId, allowed) => request("/attachment-permissions", { method: "PUT", body: { scope, personId, allowed } }),
  removeAttachmentOverride: (id) => request(`/attachment-permissions/${id}`, { method: "DELETE" }),

  getCategories: (type) => request(`/categories${type ? `?type=${type}` : ""}`),
  addCategory: (type, name) => request("/categories", { method: "POST", body: { type, name } }),
  removeCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),

  getPOCatalog: () => request("/po-catalog"),
  addPOCatalogItem: (payload) => request("/po-catalog", { method: "POST", body: payload }),
  removePOCatalogItem: (id) => request(`/po-catalog/${id}`, { method: "DELETE" }),

  getCustomFields: (entityType) => request(`/custom-fields${entityType ? `?entityType=${entityType}` : ""}`),
  addCustomField: (payload) => request("/custom-fields", { method: "POST", body: payload }),
  removeCustomField: (id) => request(`/custom-fields/${id}`, { method: "DELETE" }),

  getNotificationPrefs: () => request("/notification-prefs"),
  toggleNotificationPref: (id) => request(`/notification-prefs/${id}/toggle`, { method: "PATCH" }),
  addCustomNotificationCategory: (category) => request("/notification-prefs/custom", { method: "POST", body: { category } }),
  removeNotificationPref: (id) => request(`/notification-prefs/${id}`, { method: "DELETE" }),

  getBookings: (locationId) => request(`/bookings${locationId && locationId !== "all" ? `?locationId=${locationId}` : ""}`),
  getBookingsPaged: (locationId, from, to, offset) => {
    const p = new URLSearchParams({ limit: "50", offset: offset || 0 });
    if (locationId && locationId !== "all") p.set("locationId", locationId);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return requestWithCount(`/bookings?${p.toString()}`);
  },
  addBooking: (payload) => request("/bookings", { method: "POST", body: payload }),
  updateBooking: (id, payload) => request(`/bookings/${id}`, { method: "PUT", body: payload }),
  advanceBooking: (id) => request(`/bookings/${id}/advance`, { method: "PATCH" }),
  markBookingNoShow: (id) => request(`/bookings/${id}/no-show`, { method: "PATCH" }),
  archiveBooking: (id) => request(`/bookings/${id}/archive`, { method: "PATCH" }),
  sendBookingForReview: (id) => request(`/bookings/${id}/send-for-review`, { method: "PATCH" }),
  ownerReviewBooking: (id, decision, note) => request(`/bookings/${id}/owner-review`, { method: "PATCH", body: { decision, note } }),

  getInvoices: (locationId) => request(`/invoices${locationId && locationId !== "all" ? `?locationId=${locationId}` : ""}`),
  getInvoicesPaged: (locationId, from, to, offset) => {
    const p = new URLSearchParams({ limit: "50", offset: offset || 0 });
    if (locationId && locationId !== "all") p.set("locationId", locationId);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return requestWithCount(`/invoices?${p.toString()}`);
  },
  getInvoiceByControlNumber: (code) => request(`/invoices/by-control-number/${encodeURIComponent(code)}`),
  createInvoice: (payload) => request("/invoices", { method: "POST", body: payload }),
  payInvoice: (id, method) => request(`/invoices/${id}/pay`, { method: "PATCH", body: { method } }),

  getStaff: () => request("/staff"),
  getManualJobs: (locationId) => request(`/manual-jobs${locationId && locationId !== "all" ? `?locationId=${locationId}` : ""}`),
  addManualJob: (payload) => request("/manual-jobs", { method: "POST", body: payload }),
  advanceManualJob: (id) => request(`/manual-jobs/${id}/advance`, { method: "PATCH" }),
  reassignManualJob: (id, technicianId) => request(`/manual-jobs/${id}/reassign`, { method: "PATCH", body: { technicianId } }),
  getRoster: (locationId, from, to) => request(`/roster?locationId=${locationId}&from=${from}&to=${to}`),
  getRosterSettings: () => request("/roster/settings"),
  updateRosterSettings: (payload) => request("/roster/settings", { method: "PUT", body: payload }),
  addRosterEntry: (payload) => request("/roster", { method: "POST", body: payload }),
  updateRosterEntry: (id, payload) => request(`/roster/${id}`, { method: "PUT", body: payload }),
  advanceRosterEntry: (id) => request(`/roster/${id}/advance`, { method: "PATCH" }),
  removeRosterEntry: (id) => request(`/roster/${id}`, { method: "DELETE" }),
  autoGenerateRoster: (payload) => request("/roster/auto-generate", { method: "POST", body: payload }),
  getPayrollRates: () => request("/payroll-rates"),
  addPayrollRate: (payload) => request("/payroll-rates", { method: "POST", body: payload }),
  updatePayrollRate: (id, payload) => request(`/payroll-rates/${id}`, { method: "PUT", body: payload }),
  removePayrollRate: (id) => request(`/payroll-rates/${id}`, { method: "DELETE" }),

  addStaff: (payload) => request("/staff", { method: "POST", body: payload }),
  updateStaff: (id, payload) => request(`/staff/${id}`, { method: "PUT", body: payload }),
  removeStaff: (id) => request(`/staff/${id}`, { method: "DELETE" }),
  createStaffLogin: (id, username, password) => request(`/staff/${id}/create-login`, { method: "POST", body: { username, password } }),
  resetStaffPassword: (id, newPassword) => request(`/staff/${id}/reset-password`, { method: "PATCH", body: { newPassword } }),

  getBranches: () => request("/locations"),
  addBranch: (payload) => request("/locations", { method: "POST", body: payload }),
  updateBranch: (id, payload) => request(`/locations/${id}`, { method: "PUT", body: payload }),
  removeBranch: (id) => request(`/locations/${id}`, { method: "DELETE" }),

  getProducts: (locationId) => request(`/products${locationId && locationId !== "all" ? `?locationId=${locationId}` : ""}`),
  getProductByBarcode: (code) => request(`/products/barcode/${encodeURIComponent(code)}`),
  addProduct: (payload) => request("/products", { method: "POST", body: payload }),
  updateProduct: (id, payload) => request(`/products/${id}`, { method: "PUT", body: payload }),
  adjustProductQty: (id, delta) => request(`/products/${id}/adjust-qty`, { method: "PATCH", body: { delta } }),

  getExpenses: (params) => request(`/expenses${params ? "?" + new URLSearchParams(params) : ""}`),
  addExpense: (payload) => request("/expenses", { method: "POST", body: payload }),
  decideExpense: (id, status) => request(`/expenses/${id}/decision`, { method: "PATCH", body: { status } }),

  getSuppliers: () => request("/suppliers"),
  addSupplier: (payload) => request("/suppliers", { method: "POST", body: payload }),
  updateSupplier: (id, payload) => request(`/suppliers/${id}`, { method: "PUT", body: payload }),
  removeSupplier: (id) => request(`/suppliers/${id}`, { method: "DELETE" }),

  getPurchaseOrders: (locationId) => request(`/purchase-orders${locationId && locationId !== "all" ? `?locationId=${locationId}` : ""}`),
  createPurchaseOrder: (payload) => request("/purchase-orders", { method: "POST", body: payload }),
  decidePurchaseOrder: (id, status) => request(`/purchase-orders/${id}/decision`, { method: "PATCH", body: { status } }),
  assignPOSupplier: (id, supplierId) => request(`/purchase-orders/${id}/supplier`, { method: "PATCH", body: { supplierId } }),
  setPOPaymentTerms: (id, paymentTerms) => request(`/purchase-orders/${id}/payment-terms`, { method: "PATCH", body: { paymentTerms } }),
  setPOAttachment: (id, field, url) => request(`/purchase-orders/${id}/attachment`, { method: "PATCH", body: { field, url } }),
  setPOItemRate: (id, itemId, rate) => request(`/purchase-orders/${id}/items/${itemId}`, { method: "PATCH", body: { rate } }),
  addPONote: (id, text) => request(`/purchase-orders/${id}/notes`, { method: "POST", body: { text } }),
  sendPOQuotation: (id, supplierIds) => request(`/purchase-orders/${id}/send-quotation`, { method: "POST", body: { supplierIds } }),
  sendPOOrderConfirmation: (id) => request(`/purchase-orders/${id}/send-order-confirmation`, { method: "POST" }),
  receivePOItemScan: (id, itemId, barcode, qty) => request(`/purchase-orders/${id}/items/${itemId}/receive-scan`, { method: "PATCH", body: { barcode, qty } }),
  finalizePOReceived: (id) => request(`/purchase-orders/${id}/finalize-received`, { method: "PATCH" }),
  receivePurchaseOrder: (id) => request(`/purchase-orders/${id}/receive`, { method: "POST" }),

  getTeamMessages: (channel) => request(`/messages/team?channel=${encodeURIComponent(channel || "all")}`),
  sendTeamMessage: (payload) => request("/messages/team", { method: "POST", body: payload }),
  markTeamDownloaded: (id, savedLocationNote) => request(`/messages/team/${id}/mark-downloaded`, { method: "PATCH", body: { savedLocationNote } }),
  getClientMessages: (customerId) => request(`/messages/client/${customerId}`),
  getClientUnread: () => request("/messages/client-unread"),
  sendClientMessage: (customerId, payload) => request(`/messages/client/${customerId}`, { method: "POST", body: payload }),
  markClientDownloaded: (id, savedLocationNote) => request(`/messages/client/${id}/mark-downloaded`, { method: "PATCH", body: { savedLocationNote } }),
  sendBulkClientMessage: (segment, text) => request("/messages/client-bulk", { method: "POST", body: { segment, text } }),

  getPromotions: () => request("/promotions"),
  addPromotion: (payload) => request("/promotions", { method: "POST", body: payload }),
  updatePromotion: (id, payload) => request(`/promotions/${id}`, { method: "PUT", body: payload }),
  togglePromotion: (id) => request(`/promotions/${id}/toggle`, { method: "PATCH" }),
  checkExpiredPromotionMedia: () => request("/promotions/expire-check", { method: "POST" }),
  removePromotion: (id) => request(`/promotions/${id}`, { method: "DELETE" }),

  getCashEntries: (locationId) => request(`/cashflow/entries${locationId && locationId !== "all" ? `?locationId=${locationId}` : ""}`),
  addCashEntry: (payload) => request("/cashflow/entries", { method: "POST", body: payload }),
  getCashflowItems: (category) => request(`/cashflow/items?category=${encodeURIComponent(category || "")}`),
  addCashflowItem: (category, name) => request("/cashflow/items", { method: "POST", body: { category, name } }),
  getCashSummary: () => request("/cashflow/summary"),

  getTasks: (locationId) => request(`/compliance/tasks${locationId && locationId !== "all" ? `?locationId=${locationId}` : ""}`),
  addTask: (payload) => request("/compliance/tasks", { method: "POST", body: payload }),
  setTaskStatus: (id, status) => request(`/compliance/tasks/${id}/status`, { method: "PATCH", body: { status } }),
  submitTask: (id, attachmentUrl, attachmentName) => request(`/compliance/tasks/${id}/submit`, { method: "PATCH", body: { attachmentUrl, attachmentName } }),
  reviewTask: (id, approved, comment) => request(`/compliance/tasks/${id}/review`, { method: "PATCH", body: { approved, comment } }),
  getTaxItems: () => request("/compliance/tax-items"),
  addTaxItem: (payload) => request("/compliance/tax-items", { method: "POST", body: payload }),
  fileTaxItem: (id) => request(`/compliance/tax-items/${id}/file`, { method: "PATCH" }),

  getPrinterProfiles: () => request("/printers"),
  addPrinterProfile: (payload) => request("/printers", { method: "POST", body: payload }),
  setDefaultPrinter: (id) => request(`/printers/${id}/set-default`, { method: "PATCH" }),
  removePrinterProfile: (id) => request(`/printers/${id}`, { method: "DELETE" }),

  getProjectTargets: () => request("/business-plan/project-targets"),
  updateProjectTargets: (payload) => request("/business-plan/project-targets", { method: "PUT", body: payload }),
  getBudgetLines: () => request("/business-plan/budget-lines"),
  addBudgetLine: (payload) => request("/business-plan/budget-lines", { method: "POST", body: payload }),
  updateBudgetLine: (id, payload) => request(`/business-plan/budget-lines/${id}`, { method: "PUT", body: payload }),
  removeBudgetLine: (id) => request(`/business-plan/budget-lines/${id}`, { method: "DELETE" }),
  getBudgetSummary: () => request("/business-plan/budget-summary"),
  getBranchTargets: () => request("/business-plan/branch-targets"),
  addBranchTarget: (payload) => request("/business-plan/branch-targets", { method: "POST", body: payload }),
  updateBranchTarget: (id, payload) => request(`/business-plan/branch-targets/${id}`, { method: "PUT", body: payload }),
  removeBranchTarget: (id) => request(`/business-plan/branch-targets/${id}`, { method: "DELETE" }),

  uploadFile: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed.");
    return data; // { url, name }
  },

  // Website content management — testimonials, media gallery, and the JSON blob
  // of small public-site settings, all editable from the Intranet without touching code.
  getTestimonials: () => request("/testimonials"),
  addTestimonial: (payload) => request("/testimonials", { method: "POST", body: payload }),
  updateTestimonial: (id, payload) => request(`/testimonials/${id}`, { method: "PUT", body: payload }),
  toggleTestimonial: (id) => request(`/testimonials/${id}/toggle`, { method: "PATCH" }),
  removeTestimonial: (id) => request(`/testimonials/${id}`, { method: "DELETE" }),

  getMediaGallery: () => request("/media-gallery"),
  addMediaGalleryItem: (payload) => request("/media-gallery", { method: "POST", body: payload }),
  updateMediaGalleryItem: (id, payload) => request(`/media-gallery/${id}`, { method: "PUT", body: payload }),
  toggleMediaGalleryItem: (id) => request(`/media-gallery/${id}/toggle`, { method: "PATCH" }),
  removeMediaGalleryItem: (id) => request(`/media-gallery/${id}`, { method: "DELETE" }),

  updateWebsiteContent: (websiteContent) => request("/settings", { method: "PUT", body: { websiteContent } }),
  getSiteVisitCount: () => request("/site-visits/count"),
};
