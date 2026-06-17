"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import { getOrders, updateOrder, completeFulfillmentStep, issueSaleCertificate } from "@/lib/api";
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS, CHANNEL_LABELS } from "@/lib/utils";
import type { Order } from "@/types";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-teal-100 text-teal-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  returned: "bg-gray-100 text-gray-500",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({ status: statusFilter || undefined, per_page: 100 });
      setOrders(res.data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleStatusChange(orderId: number, status: string) {
    await updateOrder(orderId, { status });
    fetchOrders();
  }

  async function handleCompleteStep(orderId: number, stepId: number) {
    await completeFulfillmentStep(orderId, stepId);
    fetchOrders();
  }

  async function handleIssueCertificate(orderId: number) {
    const res = await issueSaleCertificate(orderId);
    if (res.data.pdf_url) {
      window.open(`${process.env.NEXT_PUBLIC_API_URL}${res.data.pdf_url}`, "_blank");
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="受注管理" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">全ステータス</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">{orders.length}件</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">読み込み中...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-400">受注はありません</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">注文番号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">商品</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">チャネル</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">購入者</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">売却価格</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">受注日時</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <>
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{order.order_number}</td>
                      <td className="px-4 py-3 max-w-48">
                        <div className="truncate font-medium text-gray-800">{order.product_name || "-"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-gray-100 text-gray-600">
                          {order.channel_type ? (CHANNEL_LABELS[order.channel_type] || order.channel_type) : "店舗"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.buyer_name || "-"}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.sale_price)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 font-medium focus:ring-2 focus:ring-brand-500 cursor-pointer ${STATUS_BADGE[order.status] || ""}`}
                        >
                          {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(order.ordered_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleIssueCertificate(order.id)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-brand-600"
                            title="売却証明書発行"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                          >
                            {expanded === order.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Fulfillment Steps Expandable */}
                    {expanded === order.id && (
                      <tr key={`${order.id}-steps`}>
                        <td colSpan={8} className="px-4 py-3 bg-gray-50">
                          <div className="flex items-center gap-1">
                            {order.fulfillment_steps.map((step, i) => (
                              <div key={step.id} className="flex items-center gap-1">
                                <button
                                  onClick={() => step.status !== "completed" && handleCompleteStep(order.id, step.id)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                    ${step.status === "completed"
                                      ? "bg-green-100 text-green-700 cursor-default"
                                      : "bg-white border border-gray-300 text-gray-600 hover:border-brand-400 hover:text-brand-600"
                                    }`}
                                >
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs
                                    ${step.status === "completed" ? "bg-green-500 text-white" : "bg-gray-200"}`}>
                                    {step.status === "completed" ? "✓" : step.step_order}
                                  </span>
                                  {step.step_name}
                                </button>
                                {i < order.fulfillment_steps.length - 1 && (
                                  <div className="w-4 h-0.5 bg-gray-300" />
                                )}
                              </div>
                            ))}
                          </div>
                          {order.gross_profit != null && (
                            <div className="mt-2 text-xs text-gray-500">
                              粗利: <span className="font-medium text-green-700">{formatCurrency(order.gross_profit)}</span>
                              {order.net_revenue != null && (
                                <> / 手取り: <span className="font-medium">{formatCurrency(order.net_revenue)}</span></>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
