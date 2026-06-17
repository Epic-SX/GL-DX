"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { getAlerts, markAlertRead, markAllAlertsRead } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { Alert } from "@/types";
import { Bell, CheckCheck, AlertTriangle, Info, AlertCircle } from "lucide-react";

const SEVERITY_ICON = {
  info: <Info size={16} className="text-blue-500" />,
  warning: <AlertTriangle size={16} className="text-yellow-500" />,
  error: <AlertCircle size={16} className="text-red-500" />,
};

const TYPE_LABELS: Record<string, string> = {
  low_stock: "在庫不足",
  stagnant: "在庫滞留",
  sale_completed: "売却完了",
  shipment_delay: "配送遅延",
  contract_renewal: "契約更新",
  fulfillment: "フルフィルメント",
  system: "システム",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  async function fetchAlerts() {
    setLoading(true);
    const res = await getAlerts(unreadOnly);
    setAlerts(res.data);
    setLoading(false);
  }

  useEffect(() => { fetchAlerts(); }, [unreadOnly]);

  async function handleRead(id: number) {
    await markAlertRead(id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
  }

  async function handleReadAll() {
    await markAllAlertsRead();
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  }

  const unread = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="flex flex-col flex-1">
      <Header title="アラート" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-gray-300 text-brand-600"
            />
            未読のみ表示
          </label>
          {unread > 0 && (
            <button onClick={handleReadAll} className="btn-secondary flex items-center gap-2 text-xs">
              <CheckCheck size={14} />
              すべて既読にする ({unread}件)
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bell size={40} className="mx-auto text-gray-300 mb-3" />
            <p>アラートはありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors
                  ${alert.is_read
                    ? "bg-white border-gray-200 opacity-60"
                    : "bg-white border-brand-200 shadow-sm"}`}
              >
                <div className="mt-0.5">
                  {SEVERITY_ICON[alert.severity] || SEVERITY_ICON.info}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="badge bg-gray-100 text-gray-600 text-xs">
                      {TYPE_LABELS[alert.type] || alert.type}
                    </span>
                    {!alert.is_read && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full" />
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {formatDateTime(alert.created_at)}
                    </span>
                  </div>
                  <div className="font-medium text-gray-800 text-sm">{alert.title}</div>
                  <div className="text-gray-500 text-sm mt-0.5">{alert.message}</div>
                </div>
                {!alert.is_read && (
                  <button
                    onClick={() => handleRead(alert.id)}
                    className="shrink-0 text-xs text-gray-400 hover:text-brand-600 transition-colors"
                  >
                    既読
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
