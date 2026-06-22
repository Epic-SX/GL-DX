"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import {
  getMonthlySales, getSalesByChannel, getStagnantInventory, getAnalyticsSummary, exportOrdersCsv,
  getMarketAnalysis, getMarketTrend, getInventoryAnalysis, getFcAnalysis, updateProduct,
} from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsSummary, MonthlySales } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { Download, AlertTriangle, RefreshCw } from "lucide-react";

const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const PIE_COLORS = ["#1e8459","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#10b981","#f97316","#6366f1"];
const BAR_COLORS = ["#1e8459","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#10b981"];

const TABS = [
  { id: "dashboard", label: "ダッシュボード" },
  { id: "market",    label: "商材・相場分析" },
  { id: "inventory", label: "在庫分析" },
  { id: "fc",        label: "FC・店舗別" },
] as const;
type TabId = typeof TABS[number]["id"];

interface ChannelSales { channel_name: string; channel_type: string; sales: number; count: number; profit: number; }
interface StagnantItem { id: number; sku: string; name: string; selling_price: number; shelf_location: string; acquired_date: string; days_in_stock: number; }
interface MarketCategory { category: string; total_count: number; sold_count: number; avg_sale_price: number; avg_profit_per_item: number; profit_margin: number; turnover_rate: number; total_profit: number; }
interface MarketTrendPoint { year: number; month: number; label: string; avg_price: number; count: number; }
interface CategoryInventory { category: string; count: number; value: number; cost_value: number; unrealized_profit: number; }
interface StagnantActionItem { id: number; name: string; sku: string; selling_price: number; cost_price: number; days_in_stock: number; suggested_price: number; shelf_location: string | null; category: string | null; }
interface InventoryAnalysis { total_inventory_value: number; total_cost_value: number; unrealized_profit: number; total_items: number; sold_last_30d: number; turnover_rate: number; stagnant_30d_count: number; stagnant_60d_count: number; stagnant_90d_count: number; by_category: CategoryInventory[]; stagnant_items: StagnantActionItem[]; }
interface StaffStat { rank: number; staff_name: string; store_name: string; role: string; order_count: number; total_sales: number; total_profit: number; profit_margin: number; }
interface StoreStat { rank: number; store_name: string; order_count: number; total_sales: number; total_profit: number; profit_margin: number; }
interface FcAnalysis { year: number; by_staff: StaffStat[]; by_store: StoreStat[]; ec_sales: number; store_sales: number; total_orders: number; }

function StatCard({ label, value, sub, color = "brand" }: { label: string; value: string; sub?: string; color?: string }) {
  const colors: Record<string, string> = { brand: "text-brand-700", green: "text-green-700", blue: "text-blue-700", orange: "text-orange-600" };
  return (
    <div className="card p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${colors[color] ?? colors.brand}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function StagnantBadge({ days }: { days: number }) {
  if (days >= 90) return <span className="badge bg-red-100 text-red-700 font-semibold">{days}日</span>;
  if (days >= 60) return <span className="badge bg-orange-100 text-orange-700 font-semibold">{days}日</span>;
  return <span className="badge bg-yellow-100 text-yellow-700">{days}日</span>;
}

function RankBadge({ rank }: { rank: number }) {
  const cls = rank === 1 ? "bg-yellow-100 text-yellow-700" : rank === 2 ? "bg-gray-200 text-gray-700" : rank === 3 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500";
  return <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${cls}`}>{rank}</span>;
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [year, setYear] = useState(new Date().getFullYear());

  // Tab 1
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlySales[]>([]);
  const [channelSales, setChannelSales] = useState<ChannelSales[]>([]);
  const [stagnant, setStagnant] = useState<StagnantItem[]>([]);

  // Tab 2
  const [marketData, setMarketData] = useState<MarketCategory[]>([]);
  const [marketTrend, setMarketTrend] = useState<MarketTrendPoint[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [marketSort, setMarketSort] = useState<"sold_count" | "avg_sale_price" | "turnover_rate" | "profit_margin">("sold_count");

  // Tab 3
  const [inventoryAnalysis, setInventoryAnalysis] = useState<InventoryAnalysis | null>(null);
  const [stagnantFilter, setStagnantFilter] = useState<30 | 60 | 90>(30);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Tab 4
  const [fcData, setFcData] = useState<FcAnalysis | null>(null);
  const [fcYear, setFcYear] = useState(new Date().getFullYear());
  const [fcView, setFcView] = useState<"store" | "staff">("store");

  useEffect(() => {
    if (activeTab !== "dashboard") return;
    Promise.all([
      getAnalyticsSummary(),
      getMonthlySales(year),
      getSalesByChannel(),
      getStagnantInventory(30),
    ]).then(([s, m, c, st]) => {
      setSummary(s.data);
      setMonthly(m.data);
      setChannelSales(c.data);
      setStagnant(st.data);
    });
  }, [activeTab, year]);

  useEffect(() => {
    if (activeTab !== "market") return;
    getMarketAnalysis().then((r) => setMarketData(r.data));
  }, [activeTab]);

  const loadTrend = useCallback((cat: string | null) => {
    getMarketTrend(cat ? { category: cat } : {}).then((r) => setMarketTrend(r.data));
  }, []);

  useEffect(() => {
    if (activeTab !== "market") return;
    loadTrend(selectedCategory);
  }, [activeTab, selectedCategory, loadTrend]);

  useEffect(() => {
    if (activeTab !== "inventory") return;
    getInventoryAnalysis().then((r) => setInventoryAnalysis(r.data));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "fc") return;
    getFcAnalysis(fcYear).then((r) => setFcData(r.data));
  }, [activeTab, fcYear]);

  async function handleExportCsv() {
    try {
      const res = await exportOrdersCsv({ start_date: `${year}-01-01`, end_date: `${year}-12-31`, status: "completed" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = `orders_${year}.csv`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert("エクスポートに失敗しました"); }
  }

  async function handleMarkdown(item: StagnantActionItem) {
    if (!confirm(`「${item.name}」を¥${item.suggested_price.toLocaleString()}に値下げしますか？`)) return;
    setActionLoading(item.id);
    try {
      await updateProduct(item.id, { selling_price: item.suggested_price });
      const r = await getInventoryAnalysis();
      setInventoryAnalysis(r.data);
    } finally { setActionLoading(null); }
  }

  const sortedMarket = [...marketData].sort((a, b) => b[marketSort] - a[marketSort]);
  const filteredStagnant = inventoryAnalysis?.stagnant_items.filter((x) => x.days_in_stock >= stagnantFilter) ?? [];
  const barData = monthly.map((d) => ({ month: MONTHS[d.month - 1], 売上: d.sales, 粗利: d.profit }));
  const pieData = channelSales.map((c) => ({ name: c.channel_name, value: c.sales }));
  const yearTotal = monthly.reduce((s, d) => s + d.sales, 0);
  const yearProfit = monthly.reduce((s, d) => s + d.profit, 0);

  return (
    <div className="flex flex-col flex-1">
      <Header title="売上分析" />
      <div className="p-6 space-y-4">
        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── Tab 1: Dashboard ─── */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">年度:</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}年</option>)}
              </select>
              <div className="ml-auto flex items-center gap-4 text-sm">
                <span className="text-gray-500">年間売上: <strong className="text-brand-700">{formatCurrency(yearTotal)}</strong></span>
                <span className="text-gray-500">年間粗利: <strong className="text-green-700">{formatCurrency(yearProfit)}</strong></span>
                <button onClick={handleExportCsv} className="btn-secondary flex items-center gap-1.5 text-xs">
                  <Download size={14} />CSV出力
                </button>
              </div>
            </div>

            {summary && (
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="今月売上" value={formatCurrency(summary.month_sales)} sub={`${summary.month_orders}件`} color="brand" />
                <StatCard label="今月粗利" value={formatCurrency(summary.month_gross_profit)} color="green" />
                <StatCard label="在庫総額" value={formatCurrency(summary.total_inventory_value)} sub={`${summary.total_inventory}点`} color="blue" />
                <StatCard label="滞留在庫(30日+)" value={`${summary.stagnant_30_days}点`} color="orange" />
              </div>
            )}

            <div className="card">
              <h2 className="text-base font-semibold text-gray-800 mb-4">月別売上・粗利</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="売上" fill="#1e8459" radius={[4,4,0,0]} />
                  <Bar dataKey="粗利" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-base font-semibold text-gray-800 mb-4">チャネル別売上構成</h2>
                {pieData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={160} height={160}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1.5">
                      {channelSales.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-gray-700">{c.channel_name}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(c.sales)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">データなし</div>
                )}
              </div>

              <div className="card">
                <h2 className="text-base font-semibold text-gray-800 mb-4">
                  滞留在庫（30日以上）
                  {stagnant.length > 0 && <span className="ml-2 badge bg-orange-100 text-orange-700">{stagnant.length}点</span>}
                </h2>
                {stagnant.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">滞留在庫なし</div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {stagnant.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-gray-800">{item.name}</div>
                          <div className="text-xs text-gray-400">{item.shelf_location || "棚未設定"}</div>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <div className="font-medium">{formatCurrency(item.selling_price)}</div>
                          <div className="text-xs text-orange-600 font-medium">{item.days_in_stock}日</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab 2: Market Analysis ─── */}
        {activeTab === "market" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 flex-1">
                ※ オークファン連携（一括出品・外部相場データ取得）はPhase 2で実装予定です
              </div>
              <div className="flex items-center gap-2 text-sm">
                <label className="text-gray-600">並び順:</label>
                <select value={marketSort} onChange={(e) => setMarketSort(e.target.value as typeof marketSort)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                  <option value="sold_count">売却数</option>
                  <option value="avg_sale_price">平均販売額</option>
                  <option value="turnover_rate">回転率</option>
                  <option value="profit_margin">利益率</option>
                </select>
              </div>
            </div>

            <div className="card">
              <h2 className="text-base font-semibold text-gray-800 mb-3">カテゴリ別相場分析</h2>
              <p className="text-xs text-gray-400 mb-3">行をクリックしてカテゴリの相場推移を表示</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2 px-3 font-medium text-gray-600">カテゴリ</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">在庫数</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">売却数</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">平均販売額</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">平均落札額</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">回転率</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">利益率</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600">累計粗利</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedMarket.map((row, i) => (
                      <tr key={row.category}
                        onClick={() => setSelectedCategory(selectedCategory === row.category ? null : row.category)}
                        className={`cursor-pointer transition-colors ${
                          selectedCategory === row.category ? "bg-brand-50 border-l-2 border-l-brand-500" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="py-3 px-3 font-medium text-gray-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                            {row.category}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right text-gray-500">{row.total_count}</td>
                        <td className="py-3 px-3 text-right font-medium">{row.sold_count}</td>
                        <td className="py-3 px-3 text-right font-medium text-brand-700">{formatCurrency(row.avg_sale_price)}</td>
                        <td className="py-3 px-3 text-right text-gray-600">{formatCurrency(row.avg_sale_price)}</td>
                        <td className="py-3 px-3 text-right">
                          <span className={`font-medium ${row.turnover_rate >= 0.7 ? "text-green-600" : row.turnover_rate >= 0.5 ? "text-yellow-600" : "text-red-500"}`}>
                            {(row.turnover_rate * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-gray-700">{row.profit_margin}%</td>
                        <td className="py-3 px-3 text-right font-medium text-green-700">{formatCurrency(row.total_profit)}</td>
                      </tr>
                    ))}
                    {sortedMarket.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-8 text-gray-400">データなし</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-800">
                  相場推移 {selectedCategory ? `— ${selectedCategory}` : "（全カテゴリ）"}
                </h2>
                {selectedCategory && (
                  <button onClick={() => setSelectedCategory(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                    クリア
                  </button>
                )}
              </div>
              {marketTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={marketTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), "平均販売額"]} />
                    <Line type="monotone" dataKey="avg_price" stroke="#1e8459" strokeWidth={2} dot={{ r: 4 }} name="平均販売額" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm">カテゴリを選択するか、売却データが不足しています</div>
              )}
            </div>
          </div>
        )}

        {/* ─── Tab 3: Inventory Analysis ─── */}
        {activeTab === "inventory" && (
          inventoryAnalysis ? (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="在庫総額（販売価格）" value={formatCurrency(inventoryAnalysis.total_inventory_value)} sub={`${inventoryAnalysis.total_items}点`} color="brand" />
                <StatCard label="未実現利益" value={formatCurrency(inventoryAnalysis.unrealized_profit)} sub={`原価: ${formatCurrency(inventoryAnalysis.total_cost_value)}`} color="green" />
                <StatCard label="在庫回転率（年換算）" value={`${inventoryAnalysis.turnover_rate}回`} sub={`先月${inventoryAnalysis.sold_last_30d}件売却`} color="blue" />
                <StatCard label="滞留在庫" value={`${inventoryAnalysis.stagnant_30d_count}点`} sub={`60日+: ${inventoryAnalysis.stagnant_60d_count}点 / 90日+: ${inventoryAnalysis.stagnant_90d_count}点`} color="orange" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="card">
                  <h2 className="text-base font-semibold text-gray-800 mb-4">カテゴリ別在庫額</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={inventoryAnalysis.by_category} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="value" name="在庫額" fill="#1e8459" radius={[0,4,4,0]} />
                      <Bar dataKey="cost_value" name="原価" fill="#3b82f6" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h2 className="text-base font-semibold text-gray-800 mb-4">カテゴリ別詳細</h2>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {inventoryAnalysis.by_category.map((cat, i) => (
                      <div key={cat.category} className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 truncate">{cat.category}</div>
                          <div className="text-xs text-gray-400">{cat.count}点</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-medium text-brand-700">{formatCurrency(cat.value)}</div>
                          <div className="text-xs text-green-600">利益 {formatCurrency(cat.unrealized_profit)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-orange-500" />
                    <h2 className="text-base font-semibold text-gray-800">滞留在庫管理 / 値下げ・オークション移行</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">表示基準:</span>
                    {([30, 60, 90] as const).map((d) => (
                      <button key={d} onClick={() => setStagnantFilter(d)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          stagnantFilter === d ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {d}日+
                      </button>
                    ))}
                  </div>
                </div>

                {filteredStagnant.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">{stagnantFilter}日以上の滞留在庫はありません</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">商品名</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">棚番号</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">現在価格</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">原価</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">滞留日数</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">値下げ提案</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">アクション</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStagnant.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <div className="font-medium text-gray-800 truncate max-w-52">{item.name}</div>
                            <div className="text-xs text-gray-400">{item.category}</div>
                          </td>
                          <td className="py-3 px-3 text-gray-500 text-xs">{item.shelf_location || "-"}</td>
                          <td className="py-3 px-3 text-right font-medium">{formatCurrency(item.selling_price)}</td>
                          <td className="py-3 px-3 text-right text-gray-500">{formatCurrency(item.cost_price)}</td>
                          <td className="py-3 px-3 text-right"><StagnantBadge days={item.days_in_stock} /></td>
                          <td className="py-3 px-3 text-right">
                            <div className="font-medium text-brand-700">{formatCurrency(item.suggested_price)}</div>
                            <div className="text-xs text-gray-400">-{((1 - item.suggested_price / item.selling_price) * 100).toFixed(0)}%</div>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleMarkdown(item)}
                              disabled={actionLoading === item.id}
                              className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium hover:bg-orange-200 disabled:opacity-50 flex items-center gap-1 ml-auto"
                            >
                              {actionLoading === item.id && <RefreshCw size={10} className="animate-spin" />}
                              値下げ実行
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">読み込み中...</div>
          )
        )}

        {/* ─── Tab 4: FC / Store Analysis ─── */}
        {activeTab === "fc" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">年度:</label>
              <select value={fcYear} onChange={(e) => setFcYear(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}年</option>)}
              </select>
              <div className="ml-auto flex gap-1 bg-gray-100 rounded-lg p-1">
                <button onClick={() => setFcView("store")}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${fcView === "store" ? "bg-white text-brand-700 shadow-sm" : "text-gray-500"}`}>
                  店舗別
                </button>
                <button onClick={() => setFcView("staff")}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${fcView === "staff" ? "bg-white text-brand-700 shadow-sm" : "text-gray-500"}`}>
                  スタッフ別
                </button>
              </div>
            </div>

            {fcData ? (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <StatCard label="総受注件数" value={`${fcData.total_orders}件`} sub={`${fcYear}年`} color="brand" />
                  <StatCard label="EC売上" value={formatCurrency(fcData.ec_sales)} sub="Amazon / 楽天 / Shopify / 海外" color="blue" />
                  <StatCard label="店舗売上" value={formatCurrency(fcData.store_sales)} sub="直営・FC店舗" color="green" />
                  <StatCard label="展開店舗数" value={`${fcData.by_store.length}店舗`} color="orange" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="card">
                    <h2 className="text-base font-semibold text-gray-800 mb-4">EC売上 vs 店舗売上</h2>
                    {(fcData.ec_sales + fcData.store_sales) > 0 ? (
                      <div className="flex items-center gap-6">
                        <ResponsiveContainer width={150} height={150}>
                          <PieChart>
                            <Pie data={[
                              { name: "EC売上", value: fcData.ec_sales },
                              { name: "店舗売上", value: fcData.store_sales },
                            ]} dataKey="value" cx="50%" cy="50%" outerRadius={65}>
                              <Cell fill="#3b82f6" />
                              <Cell fill="#1e8459" />
                            </Pie>
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-3">
                          {[
                            { label: "EC売上", value: fcData.ec_sales, color: "bg-blue-500" },
                            { label: "店舗売上", value: fcData.store_sales, color: "bg-brand-600" },
                          ].map((d) => (
                            <div key={d.label} className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${d.color}`} />
                              <div>
                                <div className="text-xs text-gray-500">{d.label}</div>
                                <div className="font-bold text-gray-800">{formatCurrency(d.value)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm">売上データなし</div>
                    )}
                  </div>

                  <div className="card">
                    <h2 className="text-base font-semibold text-gray-800 mb-4">店舗別売上ランキング</h2>
                    {fcData.by_store.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={fcData.by_store} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="store_name" tick={{ fontSize: 11 }} width={70} />
                          <Tooltip formatter={(v: number) => formatCurrency(v)} />
                          <Legend />
                          <Bar dataKey="total_sales" name="売上" fill="#1e8459" radius={[0,4,4,0]} />
                          <Bar dataKey="total_profit" name="粗利" fill="#3b82f6" radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm">データなし</div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-base font-semibold text-gray-800 mb-4">
                    {fcView === "store" ? "店舗別ランキング" : "スタッフ別ランキング"}
                  </h2>
                  {fcView === "store" ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-2 px-3 font-medium text-gray-600 w-12">順位</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">店舗名</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">受注件数</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">売上</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">粗利</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">利益率</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {fcData.by_store.map((s) => (
                          <tr key={s.store_name} className="hover:bg-gray-50">
                            <td className="py-3 px-3"><RankBadge rank={s.rank} /></td>
                            <td className="py-3 px-3 font-medium text-gray-800">{s.store_name}</td>
                            <td className="py-3 px-3 text-right text-gray-600">{s.order_count}件</td>
                            <td className="py-3 px-3 text-right font-medium text-brand-700">{formatCurrency(s.total_sales)}</td>
                            <td className="py-3 px-3 text-right font-medium text-green-700">{formatCurrency(s.total_profit)}</td>
                            <td className="py-3 px-3 text-right text-gray-700">{s.profit_margin}%</td>
                          </tr>
                        ))}
                        {fcData.by_store.length === 0 && (
                          <tr><td colSpan={6} className="text-center py-8 text-gray-400">データなし</td></tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-2 px-3 font-medium text-gray-600 w-12">順位</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">スタッフ名</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">所属店舗</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">買取件数</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">売上</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">粗利</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">利益率</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {fcData.by_staff.map((s) => (
                          <tr key={s.staff_name} className="hover:bg-gray-50">
                            <td className="py-3 px-3"><RankBadge rank={s.rank} /></td>
                            <td className="py-3 px-3 font-medium text-gray-800">{s.staff_name}</td>
                            <td className="py-3 px-3 text-gray-600">{s.store_name}</td>
                            <td className="py-3 px-3 text-right text-gray-600">{s.order_count}件</td>
                            <td className="py-3 px-3 text-right font-medium text-brand-700">{formatCurrency(s.total_sales)}</td>
                            <td className="py-3 px-3 text-right font-medium text-green-700">{formatCurrency(s.total_profit)}</td>
                            <td className="py-3 px-3 text-right text-gray-700">{s.profit_margin}%</td>
                          </tr>
                        ))}
                        {fcData.by_staff.length === 0 && (
                          <tr><td colSpan={7} className="text-center py-8 text-gray-400">データなし</td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">読み込み中...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
