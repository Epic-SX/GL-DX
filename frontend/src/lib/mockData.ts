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
    primary_image_url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop",
    images: [
      { id: 1, url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop", is_primary: true },
      { id: 2, url: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop", is_primary: false },
      { id: 3, url: "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&auto=format&fit=crop", is_primary: false },
    ],
  },
  {
    id: 2, sku: "GL20260102-0002", name: "iPhone 15 Pro 256GB チタニウムブラック",
    brand: "Apple", category: "スマートフォン", condition: "S", cost_price: 90000,
    selling_price: 128000, status: "in_stock", stock_quantity: 1, shelf_location: "B-2-1",
    description: "SIMフリー、傷なし、バッテリー容量99%。",
    barcode: "0194252897010", purchased_at: "2026-05-28", created_at: "2026-05-28T14:30:00",
    primary_image_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&auto=format&fit=crop",
    images: [
      { id: 4, url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop", is_primary: true },
      { id: 5, url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop", is_primary: false },
    ],
  },
  {
    id: 3, sku: "GL20260105-0003", name: "PlayStation 5 CFI-1200A01",
    brand: "Sony", category: "ゲーム", condition: "B", cost_price: 28000,
    selling_price: 48000, status: "in_stock", stock_quantity: 2, shelf_location: "C-3-2",
    description: "動作確認済み、コントローラー1本付属。",
    barcode: "4948872415033", purchased_at: "2026-06-01", created_at: "2026-06-01T11:00:00",
    primary_image_url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&auto=format&fit=crop",
    images: [
      { id: 6, url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&auto=format&fit=crop", is_primary: true },
      { id: 7, url: "https://images.unsplash.com/photo-1617096200347-cb04ae810b1d?w=800&auto=format&fit=crop", is_primary: false },
    ],
  },
  {
    id: 4, sku: "GL20260108-0004", name: "Rolex Submariner Date 126610LN",
    brand: "Rolex", category: "腕時計", condition: "A", cost_price: 750000,
    selling_price: 1050000, status: "in_stock", stock_quantity: 1, shelf_location: "D-1-1",
    description: "2023年購入、保証書・付属BOX完備。",
    barcode: "7610622000001", purchased_at: "2026-06-05", created_at: "2026-06-05T09:00:00",
    primary_image_url: "https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=400&auto=format&fit=crop",
    images: [
      { id: 8, url: "https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=800&auto=format&fit=crop", is_primary: true },
      { id: 9, url: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800&auto=format&fit=crop", is_primary: false },
    ],
  },
  {
    id: 5, sku: "GL20260110-0005", name: "Nintendo Switch 有機ELモデル ホワイト",
    brand: "Nintendo", category: "ゲーム", condition: "B", cost_price: 18000,
    selling_price: 28000, status: "reserved", stock_quantity: 1, shelf_location: "C-3-5",
    description: "Joy-Con付属、ドック付き。",
    barcode: "0045496453435", purchased_at: "2026-06-08", created_at: "2026-06-08T15:00:00",
    primary_image_url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&auto=format&fit=crop",
    images: [
      { id: 10, url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&auto=format&fit=crop", is_primary: true },
    ],
  },
  {
    id: 6, sku: "GL20260112-0006", name: "Louis Vuitton ネヴァーフル MM",
    brand: "Louis Vuitton", category: "バッグ", condition: "A", cost_price: 65000,
    selling_price: 98000, status: "in_stock", stock_quantity: 1, shelf_location: "E-2-3",
    description: "モノグラム、使用感少なめ。",
    barcode: "3400100000001", purchased_at: "2026-06-10", created_at: "2026-06-10T10:30:00",
    primary_image_url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&auto=format&fit=crop",
    images: [
      { id: 11, url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop", is_primary: true },
      { id: 12, url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop", is_primary: false },
    ],
  },
  {
    id: 7, sku: "GL20260115-0007", name: "Sony WH-1000XM5 ブラック",
    brand: "Sony", category: "オーディオ", condition: "A", cost_price: 22000,
    selling_price: 35000, status: "in_stock", stock_quantity: 3, shelf_location: "B-3-4",
    description: "ノイズキャンセリングイヤホン、ケース付き。",
    barcode: "4548736132450", purchased_at: "2026-06-12", created_at: "2026-06-12T13:00:00",
    primary_image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop",
    images: [
      { id: 13, url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop", is_primary: true },
      { id: 14, url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop", is_primary: false },
    ],
  },
  {
    id: 8, sku: "GL20260101-0008", name: "Nikon Z6III ボディ",
    brand: "Nikon", category: "カメラ", condition: "S", cost_price: 280000,
    selling_price: 380000, status: "sold", stock_quantity: 0, shelf_location: "",
    description: "新品同様。付属品完備。", sold_price: 375000,
    sold_date: "2026-06-10", purchased_at: "2026-04-15", created_at: "2026-04-15T09:00:00",
    primary_image_url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&auto=format&fit=crop",
    images: [
      { id: 15, url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop", is_primary: true },
    ],
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

export const MOCK_PRODUCT_META = {
  brands: ["Apple", "Canon", "Louis Vuitton", "Nikon", "Nintendo", "Rolex", "Sony"],
  categories: ["カメラ", "スマートフォン", "ゲーム", "腕時計", "バッグ", "オーディオ", "家電・PC"],
  acquired_from: ["一般買取", "FC大阪店", "FC名古屋店", "オークション仕入れ", "法人買取"],
};

export const MOCK_ITEM_STATS = {
  found: 2, sold_count: 1, avg_sale_price: 375000, total_sales: 375000,
  total_profit: 60500, avg_days_to_sell: 56, turnover_rate: 0.5, best_channel: "ヤフオク",
};

export const MOCK_BANK_ACCOUNTS = [
  {
    id: 1, bank_name: "三菱UFJ銀行", branch_name: "渋谷支店",
    account_type: "ordinary", account_number: "1234567",
    account_holder: "カ）グロウイングロジック", is_default: true, notes: "メイン口座",
  },
  {
    id: 2, bank_name: "住信SBIネット銀行", branch_name: "法人営業部",
    account_type: "ordinary", account_number: "9876543",
    account_holder: "カ）グロウイングロジック", is_default: false, notes: "FC決済用",
  },
];

export const MOCK_ACCOUNTING_ENTRIES = [
  {
    id: 1, voucher_number: "V20260610-0001", entry_date: "2026-06-10",
    client_id: 1, client_name: "山田 太郎",
    bank_account_id: 1, bank_account_name: "三菱UFJ銀行 渋谷支店",
    description: "Nikon Z6III ボディ 売却代金", amount: 375000,
    transfer_status: "paid", notes: null, created_at: "2026-06-10T10:30:00",
  },
  {
    id: 2, voucher_number: "V20260612-0001", entry_date: "2026-06-12",
    client_id: 2, client_name: "鈴木 健二",
    bank_account_id: 1, bank_account_name: "三菱UFJ銀行 渋谷支店",
    description: "Nintendo Switch 売却代金", amount: 28000,
    transfer_status: "paid", notes: null, created_at: "2026-06-12T14:00:00",
  },
  {
    id: 3, voucher_number: "V20260614-0001", entry_date: "2026-06-14",
    client_id: 1, client_name: "山田 太郎",
    bank_account_id: null, bank_account_name: null,
    description: "Louis Vuitton ネヴァーフル MM 売却代金", amount: 98000,
    transfer_status: "pending", notes: "振込待ち", created_at: "2026-06-14T09:00:00",
  },
  {
    id: 4, voucher_number: "V20260615-0001", entry_date: "2026-06-15",
    client_id: null, client_name: null,
    bank_account_id: 2, bank_account_name: "住信SBIネット銀行 法人営業部",
    description: "eBay PS5 売却代金 (USD)", amount: 49700,
    transfer_status: "pending", notes: "為替換算済", created_at: "2026-06-15T10:00:00",
  },
];

// ── Market analysis (相場分析) ─────────────────────────────────────────────
export const MOCK_MARKET_ANALYSIS = [
  { category: "カメラ", total_count: 8, sold_count: 6, avg_sale_price: 142000, avg_profit_per_item: 22000, profit_margin: 15.5, turnover_rate: 0.75, total_profit: 132000 },
  { category: "ゲーム・ホビー", total_count: 12, sold_count: 10, avg_sale_price: 28000, avg_profit_per_item: 8000, profit_margin: 28.6, turnover_rate: 0.83, total_profit: 80000 },
  { category: "スマートフォン", total_count: 5, sold_count: 4, avg_sale_price: 78000, avg_profit_per_item: 12000, profit_margin: 15.4, turnover_rate: 0.80, total_profit: 48000 },
  { category: "時計・宝飾", total_count: 3, sold_count: 2, avg_sale_price: 220000, avg_profit_per_item: 45000, profit_margin: 20.5, turnover_rate: 0.67, total_profit: 90000 },
  { category: "ブランド品", total_count: 4, sold_count: 2, avg_sale_price: 185000, avg_profit_per_item: 35000, profit_margin: 18.9, turnover_rate: 0.50, total_profit: 70000 },
  { category: "家電・PC", total_count: 6, sold_count: 3, avg_sale_price: 55000, avg_profit_per_item: 9000, profit_margin: 16.4, turnover_rate: 0.50, total_profit: 27000 },
  { category: "オーディオ", total_count: 4, sold_count: 2, avg_sale_price: 42000, avg_profit_per_item: 7000, profit_margin: 16.7, turnover_rate: 0.50, total_profit: 14000 },
];

export const MOCK_MARKET_TREND = [
  { year: 2026, month: 1, label: "2026年1月", avg_price: 128000, count: 8 },
  { year: 2026, month: 2, label: "2026年2月", avg_price: 134000, count: 6 },
  { year: 2026, month: 3, label: "2026年3月", avg_price: 141000, count: 9 },
  { year: 2026, month: 4, label: "2026年4月", avg_price: 138000, count: 7 },
  { year: 2026, month: 5, label: "2026年5月", avg_price: 152000, count: 11 },
  { year: 2026, month: 6, label: "2026年6月", avg_price: 145000, count: 4 },
];

// ── Inventory analysis (在庫分析) ────────────────────────────────────────────
export const MOCK_INVENTORY_ANALYSIS = {
  total_inventory_value: 3250000,
  total_cost_value: 2180000,
  unrealized_profit: 1070000,
  total_items: 28,
  sold_last_30d: 6,
  turnover_rate: 2.57,
  stagnant_30d_count: 8,
  stagnant_60d_count: 4,
  stagnant_90d_count: 2,
  by_category: [
    { category: "カメラ", count: 8, value: 1240000, cost_value: 820000, unrealized_profit: 420000 },
    { category: "ブランド品", count: 4, value: 760000, cost_value: 520000, unrealized_profit: 240000 },
    { category: "時計・宝飾", count: 3, value: 680000, cost_value: 450000, unrealized_profit: 230000 },
    { category: "スマートフォン", count: 5, value: 320000, cost_value: 215000, unrealized_profit: 105000 },
    { category: "家電・PC", count: 4, value: 180000, cost_value: 125000, unrealized_profit: 55000 },
    { category: "ゲーム・ホビー", count: 4, value: 70000, cost_value: 50000, unrealized_profit: 20000 },
  ],
  stagnant_items: [
    { id: 3, name: "Canon EOS R5 ボディ", sku: "GL20260415-0003", selling_price: 285000, cost_price: 220000, days_in_stock: 65, suggested_price: 256500, shelf_location: "B-1-1", category: "カメラ" },
    { id: 2, name: "Sony α7 IV ボディ", sku: "GL20260420-0002", selling_price: 198000, cost_price: 155000, days_in_stock: 60, suggested_price: 178200, shelf_location: "A-1-2", category: "カメラ" },
    { id: 7, name: "Leica Q2 ブラック", sku: "GL20260501-0007", selling_price: 520000, cost_price: 480000, days_in_stock: 49, suggested_price: 468000, shelf_location: "A-3-2", category: "カメラ" },
    { id: 5, name: "Rolex サブマリーナ デイト", sku: "GL20260512-0005", selling_price: 780000, cost_price: 650000, days_in_stock: 37, suggested_price: 702000, shelf_location: "C-1-1", category: "時計・宝飾" },
    { id: 4, name: "Louis Vuitton ネヴァーフル MM", sku: "GL20260520-0004", selling_price: 98000, cost_price: 72000, days_in_stock: 30, suggested_price: 88200, shelf_location: "D-2-1", category: "ブランド品" },
  ],
};

// ── FC / Store analysis (FC・店舗別分析) ─────────────────────────────────────
export const MOCK_FC_ANALYSIS = {
  year: 2026,
  by_staff: [
    { rank: 1, staff_name: "田中 一郎", store_name: "新宿店", role: "fc_owner", order_count: 24, total_sales: 2850000, total_profit: 480000, profit_margin: 16.8 },
    { rank: 2, staff_name: "鈴木 花子", store_name: "渋谷店", role: "fc_owner", order_count: 18, total_sales: 1920000, total_profit: 320000, profit_margin: 16.7 },
    { rank: 3, staff_name: "佐藤 太郎", store_name: "新宿店", role: "staff", order_count: 15, total_sales: 1450000, total_profit: 240000, profit_margin: 16.6 },
    { rank: 4, staff_name: "伊藤 美咲", store_name: "池袋店", role: "fc_owner", order_count: 12, total_sales: 980000, total_profit: 155000, profit_margin: 15.8 },
    { rank: 5, staff_name: "山田 健二", store_name: "本部", role: "gl", order_count: 8, total_sales: 650000, total_profit: 110000, profit_margin: 16.9 },
  ],
  by_store: [
    { rank: 1, store_name: "新宿店", order_count: 39, total_sales: 4300000, total_profit: 720000, profit_margin: 16.7 },
    { rank: 2, store_name: "渋谷店", order_count: 18, total_sales: 1920000, total_profit: 320000, profit_margin: 16.7 },
    { rank: 3, store_name: "池袋店", order_count: 12, total_sales: 980000, total_profit: 155000, profit_margin: 15.8 },
    { rank: 4, store_name: "本部", order_count: 8, total_sales: 650000, total_profit: 110000, profit_margin: 16.9 },
  ],
  ec_sales: 5280000,
  store_sales: 2570000,
  total_orders: 77,
};

// ── FC Store Portal (⑤) ────────────────────────────────────────────────────
export const MOCK_FC_STORES = [
  { id: 1, store_name: "新宿店", owner_name: "田中 一郎", email: "tanaka@shinjuku.gl.jp", phone: "03-1111-2222", portal_token: "fc-shinjuku-abc123", portal_active: true, last_intake: "2026-06-15", intake_count: 48, status: "active" },
  { id: 2, store_name: "渋谷店", owner_name: "鈴木 花子", email: "suzuki@shibuya.gl.jp", phone: "03-3333-4444", portal_token: "fc-shibuya-def456", portal_active: true, last_intake: "2026-06-18", intake_count: 32, status: "active" },
  { id: 3, store_name: "池袋店", owner_name: "伊藤 美咲", email: "ito@ikebukuro.gl.jp", phone: "03-5555-6666", portal_token: "fc-ikebukuro-ghi789", portal_active: true, last_intake: "2026-06-10", intake_count: 21, status: "active" },
  { id: 4, store_name: "横浜店", owner_name: "山田 健司", email: "yamada@yokohama.gl.jp", phone: "045-777-8888", portal_token: null, portal_active: false, last_intake: null, intake_count: 0, status: "pending" },
];

export const MOCK_INTAKE_REQUESTS = [
  { id: 1, store_name: "新宿店", store_id: 1, item_name: "Canon EOS R6 Mark II ボディ", brand: "Canon", category: "カメラ", condition: "A", estimated_price: 185000, quantity: 1, submitted_at: "2026-06-18T10:30:00", notes: "シャッター数2,000回以下", status: "pending", images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&auto=format&fit=crop"] },
  { id: 2, store_name: "新宿店", store_id: 1, item_name: "iPhone 14 Pro 128GB スペースブラック", brand: "Apple", category: "スマートフォン", condition: "B", estimated_price: 75000, quantity: 1, submitted_at: "2026-06-18T11:00:00", notes: "画面に微細なキズあり", status: "pending", images: ["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=200&auto=format&fit=crop"] },
  { id: 3, store_name: "渋谷店", store_id: 2, item_name: "Nintendo Switch 有機ELモデル", brand: "Nintendo", category: "ゲーム", condition: "A", estimated_price: 25000, quantity: 2, submitted_at: "2026-06-17T15:20:00", notes: "Joy-Con・ドック付属", status: "accepted" },
  { id: 4, store_name: "池袋店", store_id: 3, item_name: "Sony WH-1000XM4 ブラック", brand: "Sony", category: "オーディオ", condition: "B", estimated_price: 18000, quantity: 1, submitted_at: "2026-06-16T09:45:00", notes: "ケースなし、本体のみ", status: "accepted" },
  { id: 5, store_name: "渋谷店", store_id: 2, item_name: "Louis Vuitton ポルトフォイユ", brand: "Louis Vuitton", category: "バッグ", condition: "C", estimated_price: 28000, quantity: 1, submitted_at: "2026-06-15T14:00:00", notes: "角スレあり", status: "rejected" },
];

// ── Electronic Contracts (⑩) ────────────────────────────────────────────────
export const MOCK_CONTRACTS = [
  { id: 1, contract_number: "CTR-2026-001", fc_store_name: "新宿店", owner_name: "田中 一郎", contract_type: "FC加盟契約", amount: 500000, status: "signed", created_at: "2026-01-10", sent_at: "2026-01-12", signed_at: "2026-01-15", expires_at: "2027-01-14", notes: "初回契約" },
  { id: 2, contract_number: "CTR-2026-002", fc_store_name: "渋谷店", owner_name: "鈴木 花子", contract_type: "FC加盟契約", amount: 500000, status: "signed", created_at: "2026-02-01", sent_at: "2026-02-03", signed_at: "2026-02-07", expires_at: "2027-02-06", notes: "" },
  { id: 3, contract_number: "CTR-2026-003", fc_store_name: "池袋店", owner_name: "伊藤 美咲", contract_type: "FC加盟契約", amount: 500000, status: "signed", created_at: "2026-03-15", sent_at: "2026-03-17", signed_at: "2026-03-20", expires_at: "2027-03-19", notes: "" },
  { id: 4, contract_number: "CTR-2026-004", fc_store_name: "横浜店", owner_name: "山田 健司", contract_type: "FC加盟契約", amount: 500000, status: "sent", created_at: "2026-06-10", sent_at: "2026-06-12", signed_at: null, expires_at: null, notes: "署名待ち" },
  { id: 5, contract_number: "CTR-2026-005", fc_store_name: "大宮店（予定）", owner_name: "佐藤 次郎", contract_type: "FC加盟契約", amount: 500000, status: "draft", created_at: "2026-06-18", sent_at: null, signed_at: null, expires_at: null, notes: "内容確認中" },
];

// ── Media Gallery (⑨) ────────────────────────────────────────────────────────
export const MOCK_MEDIA_ITEMS = MOCK_PRODUCTS.flatMap((p) =>
  (p.images || []).map((img, idx) => ({
    id: img.id,
    product_id: p.id,
    product_name: p.name,
    brand: p.brand,
    category: p.category,
    url: img.url,
    is_primary: img.is_primary,
    filename: `${p.sku}-${String(idx + 1).padStart(2, "0")}.jpg`,
    uploaded_at: p.created_at,
  }))
);
