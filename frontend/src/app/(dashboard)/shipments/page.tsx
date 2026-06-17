"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { getOrders, createShipment, updateShipment, createDeliveryNote, createReceipt } from "@/lib/api";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import type { Order, Shipment } from "@/types";
import { Truck, FileText, Download, Receipt } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ShipmentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    getOrders({ status: "confirmed,processing", per_page: 200 })
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateShipment(order: Order) {
    try {
      await createShipment({
        order_id: order.id,
        carrier: "sagawa",
        recipient_name: order.buyer_name || "",
        recipient_postal_code: order.buyer_postal_code || "",
        recipient_address: order.buyer_address || "",
        recipient_phone: order.buyer_phone || "",
        sender_name: "GL株式会社",
      });
      alert("出荷情報を作成しました");
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "エラーが発生しました");
    }
  }

  async function handleDeliveryNote(shipmentId: number) {
    const res = await createDeliveryNote(shipmentId);
    if (res.data.pdf_url) {
      window.open(`${API_URL}${res.data.pdf_url}`, "_blank");
    }
  }

  async function handleReceipt(shipmentId: number) {
    try {
      const res = await createReceipt(shipmentId);
      if (res.data.pdf_url) {
        window.open(`${API_URL}${res.data.pdf_url}`, "_blank");
      }
    } catch {
      alert("受領書の発行に失敗しました");
    }
  }

  async function handleExportCSV() {
    if (selected.length === 0) return;
    try {
      const url = `${API_URL}/api/v1/shipments/sagawa/export-csv?shipment_ids=${selected.join(",")}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = "sagawa_export.csv";
      a.click();
    } catch {
      alert("CSVエクスポートに失敗しました");
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="出荷管理" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={selected.length === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-40"
          >
            <Download size={15} />
            佐川CSV出力 ({selected.length}件)
          </button>
          <span className="text-sm text-gray-500">
            確認中・処理中の受注を表示しています
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">読み込み中...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Truck size={40} className="mx-auto text-gray-300 mb-3" />
              <p>出荷待ちの受注はありません</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelected(e.target.checked ? orders.map((o) => o.id) : [])
                      }
                      className="rounded border-gray-300 text-brand-600"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">注文番号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">商品</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">お届け先</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">金額</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">受注日時</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(order.id)}
                        onChange={(e) =>
                          setSelected((prev) =>
                            e.target.checked
                              ? [...prev, order.id]
                              : prev.filter((x) => x !== order.id)
                          )
                        }
                        className="rounded border-gray-300 text-brand-600"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <div className="truncate max-w-48 font-medium text-gray-800">
                        {order.product_name || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      <div>{order.buyer_name || "-"}</div>
                      <div className="text-gray-400">{order.buyer_postal_code} {order.buyer_address}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(order.sale_price)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDateTime(order.ordered_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleCreateShipment(order)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-brand-600"
                          title="出荷情報作成"
                        >
                          <Truck size={15} />
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-brand-600"
                          title="納品書発行"
                          onClick={() => handleDeliveryNote(order.id)}
                        >
                          <FileText size={15} />
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-purple-600"
                          title="受領書発行"
                          onClick={() => handleReceipt(order.id)}
                        >
                          <Receipt size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
