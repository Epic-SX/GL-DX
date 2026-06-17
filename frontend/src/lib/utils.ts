import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const CONDITION_LABELS: Record<string, string> = {
  S: "未使用",
  A: "極美品",
  B: "美品",
  C: "良品",
  D: "訳あり",
};

export const STATUS_LABELS: Record<string, string> = {
  in_stock: "在庫",
  listed: "出品中",
  reserved: "予約済",
  sold: "売却済",
  returned: "返品",
  disposed: "廃棄",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "受注待ち",
  confirmed: "受注確定",
  processing: "処理中",
  shipped: "発送済",
  delivered: "配達済",
  completed: "完了",
  cancelled: "キャンセル",
  returned: "返品",
};

export const CHANNEL_LABELS: Record<string, string> = {
  yahoo_auction: "ヤフオク",
  mercari: "メルカリShops",
  amazon: "Amazon",
  rakuten: "楽天市場",
  rakuten_rakuma: "ラクマ",
  shopify: "自社EC",
  wholesale: "卸販売",
  store: "店舗",
  ebay: "eBay（海外）",
  aucnet: "オークネット",
  rk_auction: "RKオークション",
  overseas_auction: "その他海外",
  hp: "自社HP",
};

export const STATUS_COLORS: Record<string, string> = {
  in_stock: "bg-green-100 text-green-800",
  listed: "bg-blue-100 text-blue-800",
  reserved: "bg-yellow-100 text-yellow-800",
  sold: "bg-gray-100 text-gray-600",
  returned: "bg-red-100 text-red-800",
  disposed: "bg-gray-100 text-gray-400",
};
