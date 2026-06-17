// Static demo data used when NEXT_PUBLIC_USE_MOCK=true
// All dates are relative to the demo baseline of 2026-06

export const MOCK_USER = {
  id: 1,
  email: "admin@growlog.jp",
  name: "GL管理者",
  role: "gl",
  is_active: true,
  created_at: "2026-01-10T09:00:00",
};

export const MOCK_CHANNELS = [
  { id: 1, channel_type: "yahoo_auction", name: "ヤフオク", fee_rate: 8.8, is_active: true },
  { id: 2, channel_type: "mercari", name: "メルカリShops", fee_rate: 10.0, is_active: true },
  { id: 3, channel_type: "amazon", name: "Amazon", fee_rate: 15.0, is_active: true },
  { id: 4, channel_type: "rakuten", name: "楽天市場", fee_rate: 10.0, is_active: true },
  { id: 5, channel_type: "shopify", name: "自社EC (Shopify)", fee_rate: 0.0, is_active: true },
  { id: 6, channel_type: "wholesale", name: "卸販売", fee_rate: 0.0, is_active: true },
  { id: 7, channel_type: "store", name: "店舗販売", fee_rate: 0.0, is_active: true },
  { id: 8, channel_type: "ebay", name: "eBay（海外）", fee_rate: 12.55, is_active: true },
  { id: 9, channel_type: "aucnet", name: "オークネット", fee_rate: 5.0, is_active: true },
  { id: 10, channel_type: "rk_auction", name: "RKオークション", fee_rate: 5.0, is_active: true },
  { id: 11, channel_type: "overseas_auction", name: "その他海外オークション", fee_rate: 5.0, is_active: true },
  { id: 12, channel_type: "hp", name: "自社HP", fee_rate: 0.0, is_active: true },
];

export const MOCK_PRODUCTS = [
  {
    id: 1, sku: "GL20260101-0001", name: "Canon EOS R5 ボディ", brand: "Canon",
    category: "カメラ", condition: "A", cost_price: 150000, selling_price: 220000,
    status: "in_stock", stock_quantity: 1, shelf_location: "A-1-3",
    description: "Canon EOS R5 フルサイズミラーレス。シャッター数少なめ、付属品完備。",
    barcode: "4960999999001", purchased_at: "2026-05-20", created_at: "2026-05-20T10:00:00",
  },
  {
    id: 2, sku: "GL20260102-0002", name: "iPhone 15 Pro 256GB チタニウムブラック",
    brand: "Apple", category: "スマートフォン", condition: "S", cost_price: 90000,
    selling_price: 128000, status: "in_stock", stock_quantity: 1, shelf_location: "B-2-1",
    description: "SIMフリー、傷なし、バッテリー容量99%。",
    barcode: "0194252897010", purchased_at: "2026-05-28", created_at: "2026-05-28T14:30:00",
  },
  {
    id: 3, sku: "GL20260105-0003", name: "PlayStation 5 CFI-1200A01",
    brand: "Sony", category: "ゲーム", condition: "B", cost_price: 28000,
    selling_price: 48000, status: "in_stock", stock_quantity: 2, shelf_location: "C-3-2",
    description: "動作確認済み、コントローラー1本付属。",
    barcode: "4948872415033", purchased_at: "2026-06-01", created_at: "2026-06-01T11:00:00",
  },
  {
    id: 4, sku: "GL20260108-0004", name: "Rolex Submariner Date 126610LN",
    brand: "Rolex", category: "腕時計", condition: "A", cost_price: 750000,
    selling_price: 1050000, status: "in_stock", stock_quantity: 1, shelf_location: "D-1-1",
    description: "2023年購入、保証書・付属BOX完備。",
    barcode: "7610622000001", purchased_at: "2026-06-05", created_at: "2026-06-05T09:00:00",
  },
  {
    id: 5, sku: "GL20260110-0005", name: "Nintendo Switch 有機ELモデル ホワイト",
    brand: "Nintendo", category: "ゲーム", condition: "B", cost_price: 18000,
    selling_price: 28000, status: "reserved", stock_quantity: 1, shelf_location: "C-3-5",
    description: "Joy-Con付属、ドック付き。",
    barcode: "0045496453435", purchased_at: "2026-06-08", created_at: "2026-06-08T15:00:00",
  },
  {
    id: 6, sku: "GL20260112-0006", name: "Louis Vuitton ネヴァーフル MM",
    brand: "Louis Vuitton", category: "バッグ", condition: "A", cost_price: 65000,
    selling_price: 98000, status: "in_stock", stock_quantity: 1, shelf_location: "E-2-3",
    description: "モノグラム、使用感少なめ。",
    barcode: "3400100000001", purchased_at: "2026-06-10", created_at: "2026-06-10T10:30:00",
  },
  {
    id: 7, sku: "GL20260115-0007", name: "Sony WH-1000XM5 ブラック",
    brand: "Sony", category: "オーディオ", condition: "A", cost_price: 22000,
    selling_price: 35000, status: "in_stock", stock_quantity: 3, shelf_location: "B-3-4",
    description: "ノイズキャンセリングイヤホン、ケース付き。",
    barcode: "4548736132450", purchased_at: "2026-06-12", created_at: "2026-06-12T13:00:00",
  },
  {
    id: 8, sku: "GL20260101-0008", name: "Nikon Z6III ボディ",
    brand: "Nikon", category: "カメラ", condition: "S", cost_price: 280000,
    selling_price: 380000, status: "sold", stock_quantity: 0, shelf_location: "",
    description: "新品同様。付属品完備。", sold_price: 375000,
    sold_date: "2026-06-10", purchased_at: "2026-04-15", created_at: "2026-04-15T09:00:00",
  },
];

export const MOCK_ORDERS = [
  {
    id: 1, order_number: "GL202606100001", status: "completed",
    product_id: 8, channel_id: 1, buyer_name: "田中 一郎",
    sale_price: 375000, shipping_fee: 1500, platform_fee: 33000,
    commission_rate: 8.8, net_revenue: 340500, gross_profit: 60500,
    ordered_at: "2026-06-10T10:30:00", completed_at: "2026-06-14T16:00:00",
    product_name: "Nikon Z6III ボディ", channel_type: "yahoo_auction",
    fulfillment_steps: [
      { id: 1, step_order: 1, step_name: "受注確認", status: "completed", completed_at: "2026-06-10T11:00:00" },
      { id: 2, step_order: 2, step_name: "在庫確認", status: "completed", completed_at: "2026-06-10T11:30:00" },
      { id: 3, step_order: 3, step_name: "梱包", status: "completed", completed_at: "2026-06-11T10:00:00" },
      { id: 4, step_order: 4, step_name: "発送", status: "completed", completed_at: "2026-06-12T09:00:00" },
      { id: 5, step_order: 5, step_name: "配達完了", status: "completed", completed_at: "2026-06-14T16:00:00" },
    ],
  },
  {
    id: 2, order_number: "GL202606120001", status: "shipped",
    product_id: 5, channel_id: 2, buyer_name: "鈴木 花子",
    sale_price: 28000, shipping_fee: 800, platform_fee: 2800,
    commission_rate: 10.0, net_revenue: 24400, gross_profit: 6400,
    ordered_at: "2026-06-12T14:00:00", completed_at: null,
    product_name: "Nintendo Switch 有機ELモデル", channel_type: "mercari",
    fulfillment_steps: [
      { id: 6, step_order: 1, step_name: "受注確認", status: "completed", completed_at: "2026-06-12T15:00:00" },
      { id: 7, step_order: 2, step_name: "在庫確認", status: "completed", completed_at: "2026-06-12T15:30:00" },
      { id: 8, step_order: 3, step_name: "梱包", status: "completed", completed_at: "2026-06-13T10:00:00" },
      { id: 9, step_order: 4, step_name: "発送", status: "completed", completed_at: "2026-06-13T14:00:00" },
      { id: 10, step_order: 5, step_name: "配達完了", status: "pending", completed_at: null },
    ],
  },
  {
    id: 3, order_number: "GL202606140001", status: "confirmed",
    product_id: 6, channel_id: 1, buyer_name: "佐藤 美咲",
    sale_price: 98000, shipping_fee: 1200, platform_fee: 8624,
    commission_rate: 8.8, net_revenue: 88176, gross_profit: 23176,
    ordered_at: "2026-06-14T09:00:00", completed_at: null,
    product_name: "Louis Vuitton ネヴァーフル MM", channel_type: "yahoo_auction",
    fulfillment_steps: [
      { id: 11, step_order: 1, step_name: "受注確認", status: "completed", completed_at: "2026-06-14T09:30:00" },
      { id: 12, step_order: 2, step_name: "在庫確認", status: "completed", completed_at: "2026-06-14T10:00:00" },
      { id: 13, step_order: 3, step_name: "梱包", status: "pending", completed_at: null },
      { id: 14, step_order: 4, step_name: "発送", status: "pending", completed_at: null },
      { id: 15, step_order: 5, step_name: "配達完了", status: "pending", completed_at: null },
    ],
  },
  {
    id: 4, order_number: "GL202606150001", status: "pending",
    product_id: 3, channel_id: 8, buyer_name: "John Smith",
    sale_price: 350, shipping_fee: 25, platform_fee: 43,
    commission_rate: 12.55, net_revenue: 282, gross_profit: 94,
    ordered_at: "2026-06-15T03:00:00", completed_at: null,
    product_name: "PlayStation 5 CFI-1200A01", channel_type: "ebay",
    fulfillment_steps: [
      { id: 16, step_order: 1, step_name: "受注確認", status: "pending", completed_at: null },
      { id: 17, step_order: 2, step_name: "在庫確認", status: "pending", completed_at: null },
      { id: 18, step_order: 3, step_name: "梱包", status: "pending", completed_at: null },
      { id: 19, step_order: 4, step_name: "発送", status: "pending", completed_at: null },
      { id: 20, step_order: 5, step_name: "配達完了", status: "pending", completed_at: null },
    ],
  },
];

export const MOCK_CLIENTS = [
  {
    id: 1, name: "山田 太郎", company: "山田商事株式会社", client_type: "wholesale",
    email: "yamada@yamada-trading.co.jp", phone: "03-1234-5678", fax: "03-1234-5679",
    postal_code: "150-0001", prefecture: "東京都", city: "渋谷区", address: "渋谷1-2-3",
    payment_terms: "月末締め翌月末払い", credit_limit: 5000000, notes: "主要取引先",
    is_active: true, created_at: "2026-02-01T09:00:00",
  },
  {
    id: 2, name: "鈴木 健二", company: "鈴木リサイクル", client_type: "auction_house",
    email: "suzuki@suzuki-recycle.jp", phone: "06-9876-5432", fax: null,
    postal_code: "530-0001", prefecture: "大阪府", city: "大阪市北区", address: "梅田4-5-6",
    payment_terms: "都度払い", credit_limit: 2000000, notes: "オークション専門",
    is_active: true, created_at: "2026-03-15T10:00:00",
  },
  {
    id: 3, name: "田中 美帆", company: "ライフスタイル株式会社", client_type: "consult",
    email: "tanaka@lifestyle.co.jp", phone: "052-3456-7890", fax: null,
    postal_code: "460-0001", prefecture: "愛知県", city: "名古屋市中区", address: "栄7-8-9",
    payment_terms: "月次精算", credit_limit: 1000000, notes: "コンサルティング契約",
    is_active: true, created_at: "2026-04-01T09:00:00",
  },
];

export const MOCK_ALERTS = [
  {
    id: 1, alert_type: "stagnant", severity: "warning", is_read: false,
    title: "在庫滞留アラート: Canon EOS R5",
    message: "Canon EOS R5 ボディが入荷から27日経過しています。販売促進を検討してください。",
    product_id: 1, order_id: null, created_at: "2026-06-16T08:00:00",
  },
  {
    id: 2, alert_type: "sale_completed", severity: "info", is_read: true,
    title: "売却通知: Nikon Z6III ボディ",
    message: "商品「Nikon Z6III ボディ」が¥375,000で売却されました。",
    product_id: 8, order_id: 1, created_at: "2026-06-10T10:30:00",
  },
  {
    id: 3, alert_type: "low_stock", severity: "error", is_read: false,
    title: "在庫不足: PlayStation 5",
    message: "PlayStation 5 CFI-1200A01 の在庫が残り1点です。",
    product_id: 3, order_id: null, created_at: "2026-06-15T12:00:00",
  },
  {
    id: 4, alert_type: "fulfillment", severity: "info", is_read: false,
    title: "フルフィルメント通知: GL202606120001",
    message: "受注GL202606120001の発送が完了しました。",
    product_id: 5, order_id: 2, created_at: "2026-06-13T14:00:00",
  },
];

export const MOCK_SHIPMENTS = [
  {
    id: 1, order_id: 1, tracking_number: "0123456789012", carrier: "sagawa",
    status: "delivered", shipped_at: "2026-06-12T09:00:00", delivered_at: "2026-06-14T16:00:00",
    sagawa_csv_exported: true, created_at: "2026-06-12T08:00:00",
  },
  {
    id: 2, order_id: 2, tracking_number: "9876543210987", carrier: "sagawa",
    status: "in_transit", shipped_at: "2026-06-13T14:00:00", delivered_at: null,
    sagawa_csv_exported: true, created_at: "2026-06-13T13:00:00",
  },
];

export const MOCK_ANALYTICS_SUMMARY = {
  total_inventory: 7,
  total_inventory_value: 1929000,
  month_sales: 403000,
  month_orders: 3,
  stagnant_30_days: 1,
  avg_days_to_sell: 12.4,
  top_channel: "ヤフオク",
};

export const MOCK_MONTHLY_SALES = [
  { month: 1, year: 2026, total_sales: 285000, order_count: 2, avg_sale: 142500 },
  { month: 2, year: 2026, total_sales: 420000, order_count: 3, avg_sale: 140000 },
  { month: 3, year: 2026, total_sales: 510000, order_count: 4, avg_sale: 127500 },
  { month: 4, year: 2026, total_sales: 390000, order_count: 3, avg_sale: 130000 },
  { month: 5, year: 2026, total_sales: 680000, order_count: 5, avg_sale: 136000 },
  { month: 6, year: 2026, total_sales: 403000, order_count: 3, avg_sale: 134333 },
  { month: 7, year: 2026, total_sales: 0, order_count: 0, avg_sale: 0 },
  { month: 8, year: 2026, total_sales: 0, order_count: 0, avg_sale: 0 },
  { month: 9, year: 2026, total_sales: 0, order_count: 0, avg_sale: 0 },
  { month: 10, year: 2026, total_sales: 0, order_count: 0, avg_sale: 0 },
  { month: 11, year: 2026, total_sales: 0, order_count: 0, avg_sale: 0 },
  { month: 12, year: 2026, total_sales: 0, order_count: 0, avg_sale: 0 },
];

export const MOCK_SALES_BY_CHANNEL = [
  { channel_type: "yahoo_auction", channel_name: "ヤフオク", total_sales: 473000, order_count: 2, avg_sale: 236500 },
  { channel_type: "mercari", channel_name: "メルカリShops", total_sales: 28000, order_count: 1, avg_sale: 28000 },
  { channel_type: "ebay", channel_name: "eBay（海外）", total_sales: 49700, order_count: 1, avg_sale: 49700 },
];

export const MOCK_STAGNANT = [
  { ...MOCK_PRODUCTS[0], days_since_purchase: 27 },
];
