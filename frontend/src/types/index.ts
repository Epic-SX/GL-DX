export type UserRole = "gl" | "fc_owner" | "staff" | "viewer";

export interface User {
  id: number;
  email: string;
  name: string;
  name_kana?: string;
  role: UserRole;
  store_name?: string;
  phone?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export type ProductCondition = "S" | "A" | "B" | "C" | "D";
export type ProductStatus = "in_stock" | "listed" | "reserved" | "sold" | "returned" | "disposed";

export interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  id: number;
  sku: string;
  jan_code?: string;
  barcode?: string;
  name: string;
  brand?: string;
  model_number?: string;
  category?: string;
  subcategory?: string;
  condition: ProductCondition;
  status: ProductStatus;
  cost_price: number;
  selling_price: number;
  min_selling_price?: number;
  shelf_location?: string;
  stock_quantity: number;
  weight_g?: number;
  accessories?: string;
  condition_notes?: string;
  description?: string;
  internal_notes?: string;
  acquired_date?: string;
  acquired_from?: string;
  sold_date?: string;
  sold_price?: number;
  days_in_stock?: number;
  images: ProductImage[];
  primary_image_url?: string;
  created_at: string;
  updated_at?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "returned";

export interface FulfillmentStep {
  id: number;
  step_order: number;
  step_name: string;
  status: string;
  completed_at?: string;
  notes?: string;
}

export interface Order {
  id: number;
  order_number: string;
  product_id: number;
  product_name?: string;
  channel_id?: number;
  channel_type?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_postal_code?: string;
  buyer_address?: string;
  sale_price: number;
  shipping_fee: number;
  platform_fee: number;
  commission_rate?: number;
  net_revenue?: number;
  gross_profit?: number;
  status: OrderStatus;
  external_order_id?: string;
  platform_notes?: string;
  internal_notes?: string;
  ordered_at: string;
  completed_at?: string;
  fulfillment_steps: FulfillmentStep[];
  created_at: string;
}

export type Carrier = "sagawa" | "yamato" | "yupack" | "other";
export type ShipmentStatus = "preparing" | "shipped" | "in_transit" | "delivered" | "failed" | "returned";

export interface Shipment {
  id: number;
  order_id: number;
  carrier: Carrier;
  tracking_number?: string;
  status: ShipmentStatus;
  recipient_name?: string;
  recipient_postal_code?: string;
  recipient_address?: string;
  recipient_phone?: string;
  sender_name?: string;
  weight_g?: number;
  size_code?: string;
  shipping_label_url?: string;
  shipped_at?: string;
  delivered_at?: string;
  sagawa_csv_exported: boolean;
  created_at: string;
}

export interface Alert {
  id: number;
  type: string;
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  is_read: boolean;
  product_id?: number;
  order_id?: number;
  created_at: string;
}

export interface Channel {
  id: number;
  name: string;
  channel_type: string;
  is_active: boolean;
  fee_rate?: number;
}

export interface AnalyticsSummary {
  total_inventory: number;
  total_inventory_value: number;
  month_sales: number;
  month_orders: number;
  month_gross_profit: number;
  stagnant_30_days: number;
  pending_orders: number;
}

export interface MonthlySales {
  month: number;
  sales: number;
  profit: number;
  count: number;
}

export type ClientType = "wholesale" | "consult" | "auction_house" | "direct" | "other";

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  wholesale: "卸業者",
  consult: "コンサル",
  auction_house: "オークション業者",
  direct: "直販顧客",
  other: "その他",
};

export interface Client {
  id: number;
  name: string;
  company?: string;
  client_type: ClientType;
  email?: string;
  phone?: string;
  fax?: string;
  postal_code?: string;
  prefecture?: string;
  city?: string;
  address?: string;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface StockMovement {
  id: number;
  reason: string;
  from_location?: string;
  to_location?: string;
  quantity: number;
  notes?: string;
  moved_by?: string;
  moved_at: string;
}
