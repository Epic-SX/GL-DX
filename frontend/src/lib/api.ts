import axios from "axios";
import Cookies from "js-cookie";
import * as M from "./mockData";

const MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ── axios instance (used only when MOCK=false) ────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove("access_token");
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── mock helper ───────────────────────────────────────────────────────────
function ok<T>(data: T) {
  return Promise.resolve({ data, status: 200, statusText: "OK", headers: {}, config: {} as never });
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const login = (email: string, _password: string) => {
  if (MOCK) {
    Cookies.set("access_token", "mock-demo-token");
    return ok({ access_token: "mock-demo-token", token_type: "bearer", user: M.MOCK_USER });
  }
  return api.post("/auth/login", { email, password: _password });
};

export const getMe = () =>
  MOCK ? ok(M.MOCK_USER) : api.get("/auth/me");

// ── Products ──────────────────────────────────────────────────────────────
export const getProducts = (params?: Record<string, unknown>) => {
  if (MOCK) {
    let list = [...M.MOCK_PRODUCTS];
    if (params?.status) list = list.filter((p) => p.status === params.status);
    if (params?.category) list = list.filter((p) => p.category === params.category);
    if (params?.q) {
      const q = String(params.q).toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q)
      );
    }
    return ok(list);
  }
  return api.get("/products", { params });
};

export const getProduct = (id: number) =>
  MOCK
    ? ok(M.MOCK_PRODUCTS.find((p) => p.id === id) ?? M.MOCK_PRODUCTS[0])
    : api.get(`/products/${id}`);

export const createProduct = (data: unknown) =>
  MOCK
    ? ok({ ...M.MOCK_PRODUCTS[0], ...(data as object), id: 99, sku: "GL20260616-0099" })
    : api.post("/products", data);

export const updateProduct = (id: number, data: unknown) =>
  MOCK
    ? ok({ ...(M.MOCK_PRODUCTS.find((p) => p.id === id) ?? M.MOCK_PRODUCTS[0]), ...(data as object) })
    : api.patch(`/products/${id}`, data);

export const deleteProduct = (id: number) =>
  MOCK ? ok({ id }) : api.delete(`/products/${id}`);

export const uploadProductImage = (id: number, file: File, isPrimary = false) => {
  if (MOCK) return ok({ id: 1, product_id: id, url: "/mock-image.jpg", is_primary: isPrimary });
  const fd = new FormData();
  fd.append("file", file);
  fd.append("is_primary", String(isPrimary));
  return api.post(`/products/${id}/images`, fd, { headers: { "Content-Type": "multipart/form-data" } });
};

export const getProductByBarcode = (barcode: string) => {
  if (MOCK) {
    const p = M.MOCK_PRODUCTS.find((x) => x.barcode === barcode || x.sku === barcode);
    return p ? ok(p) : Promise.reject({ response: { status: 404 } });
  }
  return api.get(`/products/barcode/${barcode}`);
};

// ── Orders ────────────────────────────────────────────────────────────────
export const getOrders = (params?: Record<string, unknown>) => {
  if (MOCK) {
    let list = [...M.MOCK_ORDERS];
    if (params?.status) list = list.filter((o) => o.status === params.status);
    return ok(list);
  }
  return api.get("/orders", { params });
};

export const getOrder = (id: number) =>
  MOCK
    ? ok(M.MOCK_ORDERS.find((o) => o.id === id) ?? M.MOCK_ORDERS[0])
    : api.get(`/orders/${id}`);

export const createOrder = (data: unknown) =>
  MOCK
    ? ok({ ...M.MOCK_ORDERS[0], ...(data as object), id: 99, order_number: "GL202606160099", status: "pending" })
    : api.post("/orders", data);

export const updateOrder = (id: number, data: unknown) =>
  MOCK
    ? ok({ ...(M.MOCK_ORDERS.find((o) => o.id === id) ?? M.MOCK_ORDERS[0]), ...(data as object) })
    : api.patch(`/orders/${id}`, data);

export const completeFulfillmentStep = (orderId: number, stepId: number, notes?: string) =>
  MOCK
    ? ok({ status: "ok", step: "受注確認" })
    : api.post(`/orders/${orderId}/fulfillment/${stepId}/complete`, null, { params: { notes } });

export const issueSaleCertificate = (orderId: number) =>
  MOCK
    ? ok({ certificate_number: `CERT-GL202606160099`, pdf_url: "#" })
    : api.post(`/orders/${orderId}/certificate`);

// ── Shipments ─────────────────────────────────────────────────────────────
export const createShipment = (data: unknown) =>
  MOCK
    ? ok({ ...M.MOCK_SHIPMENTS[0], ...(data as object), id: 99 })
    : api.post("/shipments", data);

export const updateShipment = (id: number, data: unknown) =>
  MOCK
    ? ok({ ...(M.MOCK_SHIPMENTS.find((s) => s.id === id) ?? M.MOCK_SHIPMENTS[0]), ...(data as object) })
    : api.patch(`/shipments/${id}`, data);

export const createDeliveryNote = (shipmentId: number) =>
  MOCK
    ? ok({ id: 1, shipment_id: shipmentId, note_number: `DN-20260616-${String(shipmentId).padStart(5, "0")}`, pdf_url: "#" })
    : api.post(`/shipments/${shipmentId}/delivery-note`);

export const exportSagawaCSV = (shipmentIds: number[]) => {
  if (MOCK) {
    const csv = "荷番号,氏名,郵便番号,住所\n1234567890,テスト様,150-0001,東京都渋谷区";
    return ok(new Blob([csv], { type: "text/csv" }));
  }
  return api.get(`/shipments/sagawa/export-csv`, {
    params: { shipment_ids: shipmentIds.join(",") },
    responseType: "blob",
  });
};

export const getRecipients = () =>
  MOCK ? ok([]) : api.get("/shipments/recipients/list");

export const createReceipt = (shipmentId: number, notes?: string) =>
  MOCK
    ? ok({ receipt_number: `REC-20260616-${String(shipmentId).padStart(5, "0")}`, pdf_url: "#" })
    : api.post(`/shipments/${shipmentId}/receipt`, null, { params: { notes } });

// ── Channels ──────────────────────────────────────────────────────────────
export const getChannels = () =>
  MOCK ? ok(M.MOCK_CHANNELS) : api.get("/channels");

export const getListings = (params?: Record<string, unknown>) =>
  MOCK ? ok([]) : api.get("/channels/listings", { params });

export const createListing = (data: unknown) =>
  MOCK ? ok({ id: 1, ...(data as object) }) : api.post("/channels/listings", data);

export const bulkListProduct = (productId: number, channelIds: number[], price: number) =>
  MOCK
    ? ok({ listed: channelIds.length, product_id: productId, price })
    : api.post("/channels/bulk-list", null, { params: { product_id: productId, channel_ids: channelIds, price } });

// ── Analytics ─────────────────────────────────────────────────────────────
export const getAnalyticsSummary = () =>
  MOCK ? ok(M.MOCK_ANALYTICS_SUMMARY) : api.get("/analytics/summary");

export const getMonthlySales = (year?: number) =>
  MOCK ? ok(M.MOCK_MONTHLY_SALES) : api.get("/analytics/sales/monthly", { params: { year } });

export const getSalesByChannel = (startDate?: string, endDate?: string) =>
  MOCK
    ? ok(M.MOCK_SALES_BY_CHANNEL)
    : api.get("/analytics/sales/by-channel", { params: { start_date: startDate, end_date: endDate } });

export const getStagnantInventory = (days = 30) =>
  MOCK ? ok(M.MOCK_STAGNANT) : api.get("/analytics/inventory/stagnant", { params: { days } });

// ── Alerts ────────────────────────────────────────────────────────────────
export const getAlerts = (unreadOnly = false) => {
  if (MOCK) {
    const list = unreadOnly ? M.MOCK_ALERTS.filter((a) => !a.is_read) : M.MOCK_ALERTS;
    return ok(list);
  }
  return api.get("/alerts", { params: { unread_only: unreadOnly } });
};

export const getUnreadAlertCount = () =>
  MOCK
    ? ok({ count: M.MOCK_ALERTS.filter((a) => !a.is_read).length })
    : api.get("/alerts/unread-count");

export const markAlertRead = (id: number) =>
  MOCK ? ok({ id }) : api.post(`/alerts/${id}/read`);

export const markAllAlertsRead = () =>
  MOCK ? ok({ updated: M.MOCK_ALERTS.length }) : api.post("/alerts/read-all");

// ── Clients ───────────────────────────────────────────────────────────────
export const getClients = (params?: Record<string, unknown>) => {
  if (MOCK) {
    let list = [...M.MOCK_CLIENTS];
    if (params?.q) {
      const q = String(params.q).toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)
      );
    }
    if (params?.client_type) list = list.filter((c) => c.client_type === params.client_type);
    if (params?.active_only === "true" || params?.active_only === true)
      list = list.filter((c) => c.is_active);
    return ok(list);
  }
  return api.get("/clients", { params });
};

export const getClient = (id: number) =>
  MOCK
    ? ok(M.MOCK_CLIENTS.find((c) => c.id === id) ?? M.MOCK_CLIENTS[0])
    : api.get(`/clients/${id}`);

export const createClient = (data: unknown) =>
  MOCK
    ? ok({ ...M.MOCK_CLIENTS[0], ...(data as object), id: 99 })
    : api.post("/clients", data);

export const updateClient = (id: number, data: unknown) =>
  MOCK
    ? ok({ ...(M.MOCK_CLIENTS.find((c) => c.id === id) ?? M.MOCK_CLIENTS[0]), ...(data as object) })
    : api.patch(`/clients/${id}`, data);

export const deleteClient = (id: number) =>
  MOCK ? ok({ id }) : api.delete(`/clients/${id}`);

// ── Stock movement ────────────────────────────────────────────────────────
export const moveProduct = (productId: number, data: unknown) =>
  MOCK
    ? ok({ product_id: productId, ...(data as object), moved_at: new Date().toISOString() })
    : api.post(`/products/${productId}/move`, data);

export const getProductMovements = (productId: number) =>
  MOCK ? ok([]) : api.get(`/products/${productId}/movements`);

// ── Orders export ─────────────────────────────────────────────────────────
export const exportOrdersCsv = (params?: Record<string, unknown>) => {
  if (MOCK) {
    const csv = "受注番号,受注日,商品名\nGL202606100001,2026/06/10,Nikon Z6III ボディ";
    return ok(new Blob(["﻿" + csv], { type: "text/csv" }));
  }
  return api.get("/orders/export/csv", { params, responseType: "blob" });
};

// ── eBay ──────────────────────────────────────────────────────────────────
export const getEbayStatus = () =>
  MOCK ? ok({ connected: false, message: "eBay OAuth未設定（デモモード）" }) : api.get("/ebay/status");

export const getEbayAuthUrl = () =>
  MOCK ? ok({ url: "#" }) : api.get("/ebay/auth/url");

export const previewEbayTranslation = (productId: number) => {
  const p = M.MOCK_PRODUCTS.find((x) => x.id === productId) ?? M.MOCK_PRODUCTS[0];
  return MOCK
    ? ok({ title_en: `[${p.condition}] ${p.brand} ${p.name}`, description_en: p.description, deepl_configured: false })
    : api.get(`/ebay/translate/${productId}`);
};

export const listOnEbay = (productId: number, usdPrice: number) =>
  MOCK
    ? ok({ listing_id: "MOCK-123456789", product_id: productId, usd_price: usdPrice })
    : api.post(`/ebay/list/${productId}`, { usd_price: usdPrice });

export const syncEbayOrders = () =>
  MOCK ? ok({ synced: 0, message: "デモモード: 同期スキップ" }) : api.post("/ebay/sync/orders");

// ── Product meta (brand/category autocomplete) ────────────────────────────
export const getProductMeta = () =>
  MOCK ? ok(M.MOCK_PRODUCT_META) : api.get("/products/meta");

// ── Item stats (③ past transaction analysis) ─────────────────────────────
export const getItemStats = (q: string) =>
  MOCK ? ok(M.MOCK_ITEM_STATS) : api.get("/analytics/item-stats", { params: { q } });

// ── Accounting entries ────────────────────────────────────────────────────
export const getAccountingEntries = (params?: Record<string, unknown>) =>
  MOCK ? ok(M.MOCK_ACCOUNTING_ENTRIES) : api.get("/accounting/entries", { params });

export const createAccountingEntry = (data: unknown) =>
  MOCK
    ? ok({ ...M.MOCK_ACCOUNTING_ENTRIES[0], ...(data as object), id: 99, voucher_number: "V20260616-0099" })
    : api.post("/accounting/entries", data);

export const updateAccountingEntry = (id: number, data: unknown) => {
  if (MOCK) {
    const e = M.MOCK_ACCOUNTING_ENTRIES.find((x) => x.id === id) ?? M.MOCK_ACCOUNTING_ENTRIES[0];
    return ok({ ...e, ...(data as object) });
  }
  return api.patch(`/accounting/entries/${id}`, data);
};

export const deleteAccountingEntry = (id: number) =>
  MOCK ? ok({ id }) : api.delete(`/accounting/entries/${id}`);

export const getAccountingSummary = (year?: number) =>
  MOCK
    ? ok({ year: year ?? 2026, total: 550700, paid: 403000, pending: 147700, entry_count: 4 })
    : api.get("/accounting/summary", { params: { year } });

// ── Bank accounts ─────────────────────────────────────────────────────────
export const getBankAccounts = () =>
  MOCK ? ok(M.MOCK_BANK_ACCOUNTS) : api.get("/accounting/bank-accounts");

export const createBankAccount = (data: unknown) =>
  MOCK ? ok({ ...M.MOCK_BANK_ACCOUNTS[0], ...(data as object), id: 99 }) : api.post("/accounting/bank-accounts", data);

export const deleteBankAccount = (id: number) =>
  MOCK ? ok({ id }) : api.delete(`/accounting/bank-accounts/${id}`);

// ── FC Portal (⑤) ────────────────────────────────────────────────────────
export const getFcStores = () =>
  MOCK ? ok(M.MOCK_FC_STORES) : api.get("/fc-portal/stores");

export const generateFcPortalUrl = (storeId: number) =>
  MOCK
    ? ok({ ...M.MOCK_FC_STORES.find((s) => s.id === storeId), portal_token: `fc-store-${storeId}-${Math.random().toString(36).slice(2, 8)}`, portal_active: true })
    : api.post(`/fc-portal/stores/${storeId}/generate-token`);

export const getIntakeRequests = (status?: string) => {
  if (MOCK) {
    const list = status ? M.MOCK_INTAKE_REQUESTS.filter((r) => r.status === status) : M.MOCK_INTAKE_REQUESTS;
    return ok(list);
  }
  return api.get("/fc-portal/intake", { params: { status } });
};

export const updateIntakeRequest = (id: number, data: { status: string }) =>
  MOCK
    ? ok({ ...M.MOCK_INTAKE_REQUESTS.find((r) => r.id === id), ...data })
    : api.patch(`/fc-portal/intake/${id}`, data);

// ── Contracts (⑩) ─────────────────────────────────────────────────────────
export const getContracts = () =>
  MOCK ? ok(M.MOCK_CONTRACTS) : api.get("/contracts");

export const createContract = (data: unknown) =>
  MOCK ? ok({ ...M.MOCK_CONTRACTS[0], ...(data as object), id: 99, contract_number: "CTR-2026-099", status: "draft" }) : api.post("/contracts", data);

export const sendContract = (id: number) =>
  MOCK ? ok({ ...M.MOCK_CONTRACTS.find((c) => c.id === id), status: "sent", sent_at: new Date().toISOString() }) : api.post(`/contracts/${id}/send`);

export const signContract = (id: number) =>
  MOCK ? ok({ ...M.MOCK_CONTRACTS.find((c) => c.id === id), status: "signed", signed_at: new Date().toISOString() }) : api.post(`/contracts/${id}/sign`);

// ── Media Gallery (⑨) ─────────────────────────────────────────────────────
export const getMediaGallery = (params?: { category?: string; product_id?: number }) => {
  if (MOCK) {
    let list = [...M.MOCK_MEDIA_ITEMS];
    if (params?.category) list = list.filter((m) => m.category === params.category);
    if (params?.product_id) list = list.filter((m) => m.product_id === params.product_id);
    return ok(list);
  }
  return api.get("/media", { params });
};

// ── Market analysis (相場分析) ────────────────────────────────────────────
export const getMarketAnalysis = () =>
  MOCK ? ok(M.MOCK_MARKET_ANALYSIS) : api.get("/analytics/market");

export const getMarketTrend = (params?: { category?: string; brand?: string; months?: number }) =>
  MOCK ? ok(M.MOCK_MARKET_TREND) : api.get("/analytics/market/trend", { params });

// ── Inventory analysis (在庫分析) ─────────────────────────────────────────
export const getInventoryAnalysis = () =>
  MOCK ? ok(M.MOCK_INVENTORY_ANALYSIS) : api.get("/analytics/inventory/analysis");

// ── FC / Store analysis (FC・店舗別) ──────────────────────────────────────
export const getFcAnalysis = (year?: number) =>
  MOCK ? ok(M.MOCK_FC_ANALYSIS) : api.get("/analytics/fc", { params: { year } });
