"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { getMonthlySales, getSalesByChannel, getStagnantInventory, getAnalyticsSummary, exportOrdersCsv } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsSummary, MonthlySales } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";

const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const PIE_COLORS = ["#1e8459","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#10b981","#f97316","#6366f1"];

interface ChannelSales {
  channel_name: string;
  channel_type: string;
  sales: number;
  count: number;
  profit: number;
}

interface StagnantItem {
  id: number;
  sku: string;
  name: string;
  selling_price: number;
  shelf_location: string;
  acquired_date: string;
  days_in_stock: number;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlySales[]>([]);
  const [channelSales, setChannelSales] = useState<ChannelSales[]>([]);
  const [stagnant, setStagnant] = useState<StagnantItem[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
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
  }, [year]);

  const barData = monthly.map((d) => ({
    month: MONTHS[d.month - 1],
    売上: d.sales,
    粗利: d.profit,
  }));

  const pieData = channelSales.map((c) => ({
    name: c.channel_name,
    value: c.sales,
  }));

  const yearTotal = monthly.reduce((s, d) => s + d.sales, 0);
  const yearProfit = monthly.reduce((s, d) => s + d.profit, 0);

  async function handleExportCsv() {
    try {
      const res = await exportOrdersCsv({
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`,
        status: "completed",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders_${year}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("エクスポートに失敗しました");
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="売上分析" />
      <div className="p-6 space-y-6">
        {/* Year selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">年度:</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              年間売上: <strong className="text-brand-700">{formatCurrency(yearTotal)}</strong>
            </span>
            <span className="text-gray-500">
              年間粗利: <strong className="text-green-700">{formatCurrency(yearProfit)}</strong>
            </span>
            <button
              onClick={handleExportCsv}
              className="btn-secondary flex items-center gap-1.5 text-xs"
            >
              <Download size={14} />
              CSV出力
            </button>
          </div>
        </div>

        {/* Monthly Bar Chart */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">月別売上・粗利</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="売上" fill="#1e8459" radius={[4, 4, 0, 0]} />
              <Bar dataKey="粗利" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Channel Pie */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-4">チャネル別売上構成</h2>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {channelSales.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-gray-700">{c.channel_name}</span>
                      </div>
                      <span className="font-medium text-gray-800">{formatCurrency(c.sales)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">データなし</div>
            )}
          </div>

          {/* Stagnant Inventory */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              滞留在庫（30日以上）
              {stagnant.length > 0 && (
                <span className="ml-2 badge bg-orange-100 text-orange-700">{stagnant.length}点</span>
              )}
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
    </div>
  );
}
