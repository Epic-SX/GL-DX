"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import { getProducts, deleteProduct, getItemStats } from "@/lib/api";
import {
  formatCurrency, formatDate,
  CONDITION_LABELS, STATUS_LABELS, STATUS_COLORS,
} from "@/lib/utils";
import type { Product } from "@/types";
import Link from "next/link";
import { Plus, Search, Trash2, Edit2, Eye, TrendingUp } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ItemStats {
  found: number; sold_count: number; avg_sale_price: number; total_sales: number;
  total_profit: number; avg_days_to_sell: number | null; turnover_rate: number; best_channel: string | null;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState<ItemStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({
        q: search || undefined,
        status: statusFilter || undefined,
        page,
        per_page: 50,
      });
      setProducts(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  // ③ Fetch item stats when search has text
  useEffect(() => {
    if (!search || search.length < 2) { setStats(null); return; }
    const t = setTimeout(async () => {
      setStatsLoading(true);
      try {
        const r = await getItemStats(search);
        setStats(r.data);
      } catch { setStats(null); }
      finally { setStatsLoading(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await deleteProduct(id);
    fetchProducts();
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="在庫管理" />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="商品名・SKU・JANコード・ブランドで検索"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">全ステータス</option>
            <option value="in_stock">在庫</option>
            <option value="listed">出品中</option>
            <option value="reserved">予約済</option>
            <option value="sold">売却済</option>
          </select>
          <Link href="/inventory/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            商品登録
          </Link>
        </div>

        {/* ③ Item stats panel */}
        {(stats || statsLoading) && search.length >= 2 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3 text-blue-700 font-medium text-sm">
              <TrendingUp size={16} />
              「{search}」の過去取引データ
              {statsLoading && <span className="text-blue-400 font-normal">（取得中...）</span>}
            </div>
            {stats && stats.sold_count > 0 ? (
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div><div className="text-gray-500 text-xs">該当商品数</div><div className="font-semibold text-gray-800">{stats.found}点</div></div>
                <div><div className="text-gray-500 text-xs">過去売却数</div><div className="font-semibold text-gray-800">{stats.sold_count}件</div></div>
                <div><div className="text-gray-500 text-xs">平均売却額</div><div className="font-semibold text-brand-700">{formatCurrency(stats.avg_sale_price)}</div></div>
                <div><div className="text-gray-500 text-xs">合計売上</div><div className="font-semibold text-gray-800">{formatCurrency(stats.total_sales)}</div></div>
                <div><div className="text-gray-500 text-xs">合計粗利</div><div className="font-semibold text-green-700">{formatCurrency(stats.total_profit)}</div></div>
                <div><div className="text-gray-500 text-xs">平均在庫日数（回転率）</div><div className="font-semibold text-gray-800">{stats.avg_days_to_sell != null ? `${stats.avg_days_to_sell}日` : "-"}</div></div>
                <div><div className="text-gray-500 text-xs">回転率</div><div className="font-semibold text-gray-800">{stats.turnover_rate}回</div></div>
                <div><div className="text-gray-500 text-xs">最多販路</div><div className="font-semibold text-gray-800">{stats.best_channel || "-"}</div></div>
              </div>
            ) : stats && (
              <p className="text-sm text-gray-500">過去の売却データがありません</p>
            )}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-16">画像</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">商品名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状態</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">販売価格</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">棚番号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">滞留日数</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">仕入日</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400">
                      商品が見つかりません
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {p.primary_image_url ? (
                          <img
                            src={p.primary_image_url.startsWith("http") ? p.primary_image_url : `${API_URL}${p.primary_image_url}`}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xs">
                            No img
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {/* ① Clickable product name */}
                        <Link href={`/inventory/${p.id}`} className="font-medium text-brand-700 hover:underline truncate max-w-52 block">{p.name}</Link>
                        {p.brand && <div className="text-xs text-gray-400">{p.brand}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.sku}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-purple-100 text-purple-700">
                          {CONDITION_LABELS[p.condition] || p.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(p.selling_price)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.shelf_location || "-"}</td>
                      <td className="px-4 py-3">
                        {p.days_in_stock != null ? (
                          <span className={p.days_in_stock > 30 ? "text-orange-600 font-medium" : "text-gray-600"}>
                            {p.days_in_stock}日
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDate(p.acquired_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/inventory/${p.id}`}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-brand-600"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            href={`/inventory/${p.id}?edit=1`}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-brand-600"
                          >
                            <Edit2 size={15} />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{products.length}件表示</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-40"
            >
              前へ
            </button>
            <span className="px-3 py-2">ページ {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={products.length < 50}
              className="btn-secondary disabled:opacity-40"
            >
              次へ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
