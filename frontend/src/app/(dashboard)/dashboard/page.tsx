"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { getAnalyticsSummary, getMonthlySales } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsSummary, MonthlySales } from "@/types";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Package, ShoppingCart, TrendingUp, Clock } from "lucide-react";

const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlySales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsSummary(),
      getMonthlySales(),
    ]).then(([s, m]) => {
      setSummary(s.data);
      setMonthlyData(m.data);
    }).finally(() => setLoading(false));
  }, []);

  const chartData = monthlyData.map((d) => ({
    month: MONTHS[d.month - 1],
    売上: d.sales,
    粗利: d.profit,
    件数: d.count,
  }));

  return (
    <div className="flex flex-col flex-1">
      <Header title="ダッシュボード" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            icon={<Package className="text-brand-600" size={22} />}
            label="在庫点数"
            value={summary ? `${summary.total_inventory.toLocaleString()}点` : "-"}
            sub={summary ? `評価額 ${formatCurrency(summary.total_inventory_value)}` : ""}
            loading={loading}
          />
          <KPICard
            icon={<TrendingUp className="text-blue-600" size={22} />}
            label="今月の売上"
            value={summary ? formatCurrency(summary.month_sales) : "-"}
            sub={summary ? `粗利 ${formatCurrency(summary.month_gross_profit)}` : ""}
            loading={loading}
          />
          <KPICard
            icon={<ShoppingCart className="text-green-600" size={22} />}
            label="今月の受注数"
            value={summary ? `${summary.month_orders}件` : "-"}
            sub={summary ? `対応中 ${summary.pending_orders}件` : ""}
            loading={loading}
          />
          <KPICard
            icon={<Clock className="text-orange-500" size={22} />}
            label="30日以上の滞留在庫"
            value={summary ? `${summary.stagnant_30_days}点` : "-"}
            sub="要確認"
            loading={loading}
            highlight={summary ? summary.stagnant_30_days > 0 : false}
          />
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">月別売上・粗利推移</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e8459" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1e8459" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="売上" stroke="#1e8459" fill="url(#salesGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="粗利" stroke="#3b82f6" fill="url(#profitGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  icon, label, value, sub, loading, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`card flex items-start gap-4 ${highlight ? "border-orange-200" : ""}`}>
      <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        {loading ? (
          <div className="h-7 w-24 bg-gray-100 animate-pulse rounded mt-1" />
        ) : (
          <div className="text-xl font-bold text-gray-900">{value}</div>
        )}
        <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}
