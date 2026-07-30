const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function getToken() {
  return localStorage.getItem("wosha_token");
}
export function setToken(token) {
  if (token) localStorage.setItem("wosha_token", token);
  else localStorage.removeItem("wosha_token");
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export const api = {
  login: (username, password, allowedRoles) => request("/auth/login", { method: "POST", body: { username, password, allowedRoles } }),
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  me: () => request("/auth/me"),
  changePassword: (currentPassword, newPassword) => request("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }),
  forgotPasswordRequest: (identifier) => request("/auth/forgot-password/request", { method: "POST", body: { identifier } }),
  forgotPasswordVerify: (username, code, newPassword) => request("/auth/forgot-password/verify", { method: "POST", body: { username, code, newPassword } }),

  getLocations: () => request("/locations"),
  addLocation: (payload) => request("/locations", { method: "POST", body: payload }),

  getCustomers: () => request("/customers"),
  addCustomer: (payload) => request("/customers", { method: "POST", body: payload }),
  updateCustomer: (id, payload) => request(`/customers/${id}`, { method: "PUT", body: payload }),

  getServices: () => request("/services"),
  addService: (payload) => request("/services", { method: "POST", body: payload }),
  updateService: (id, payload) => request(`/services/${id}`, { method: "PUT", body: payload }),

  getBookings: (locationId) => request(`/bookings${locationId && locationId !== "all" ? `?locationId=${locationId}` : ""}`),
  addBooking: (payload) => request("/bookings", { method: "POST", body: payload }),
  advanceBooking: (id) => request(`/bookings/${id}/advance`, { method: "PATCH" }),

  getInvoices: (locationId) => request(`/invoices${locationId && locationId !== "all" ? `?locationId=${locationId}` : ""}`),
  createInvoice: (payload) => request("/invoices", { method: "POST", body: payload }),
  payInvoice: (id, method) => request(`/invoices/${id}/pay`, { method: "PATCH", body: { method } }),

  getStaff: () => request("/staff"),
  addStaff: (payload) => request("/staff", { method: "POST", body: payload }),
  updateStaff: (id, payload) => request(`/staff/${id}`, { method: "PUT", body: payload }),
  removeStaff: (id) => request(`/staff/${id}`, { method: "DELETE" }),

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
  receivePurchaseOrder: (id) => request(`/purchase-orders/${id}/receive`, { method: "POST" }),

  getTeamMessages: (channel) => request(`/messages/team?channel=${encodeURIComponent(channel || "all")}`),
  sendTeamMessage: (payload) => request("/messages/team", { method: "POST", body: payload }),
  getClientMessages: (customerId) => request(`/messages/client/${customerId}`),
  getClientUnread: () => request("/messages/client-unread"),
  sendClientMessage: (customerId, payload) => request(`/messages/client/${customerId}`, { method: "POST", body: payload }),
  sendBulkClientMessage: (segment, text) => request("/messages/client-bulk", { method: "POST", body: { segment, text } }),

  getPromotions: () => request("/promotions"),
  addPromotion: (payload) => request("/promotions", { method: "POST", body: payload }),
  togglePromotion: (id) => request(`/promotions/${id}/toggle`, { method: "PATCH" }),
  removePromotion: (id) => request(`/promotions/${id}`, { method: "DELETE" }),

  getCashEntries: (locationId) => request(`/cashflow/entries${locationId && locationId !== "all" ? `?locationId=${locationId}` : ""}`),
  addCashEntry: (payload) => request("/cashflow/entries", { method: "POST", body: payload }),
  getCashSummary: () => request("/cashflow/summary"),

  getTasks: (locationId) => request(`/compliance/tasks${locationId && locationId !== "all" ? `?locationId=${locationId}` : ""}`),
  addTask: (payload) => request("/compliance/tasks", { method: "POST", body: payload }),
  setTaskStatus: (id, status) => request(`/compliance/tasks/${id}/status`, { method: "PATCH", body: { status } }),
  getTaxItems: () => request("/compliance/tax-items"),
  addTaxItem: (payload) => request("/compliance/tax-items", { method: "POST", body: payload }),
  fileTaxItem: (id) => request(`/compliance/tax-items/${id}/file`, { method: "PATCH" }),

  getPrinterProfiles: () => request("/printers"),
  addPrinterProfile: (payload) => request("/printers", { method: "POST", body: payload }),
  setDefaultPrinter: (id) => request(`/printers/${id}/set-default`, { method: "PATCH" }),
  removePrinterProfile: (id) => request(`/printers/${id}`, { method: "DELETE" }),

  getBusinessPlanTargets: () => request("/business-plan"),
  addBusinessPlanTarget: (payload) => request("/business-plan", { method: "POST", body: payload }),
  updateBusinessPlanTarget: (id, payload) => request(`/business-plan/${id}`, { method: "PUT", body: payload }),
  removeBusinessPlanTarget: (id) => request(`/business-plan/${id}`, { method: "DELETE" }),
  getBusinessPlanProgress: () => request("/business-plan/progress"),

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
};
