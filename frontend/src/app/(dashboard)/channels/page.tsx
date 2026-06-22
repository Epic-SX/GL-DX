"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { getChannels, getListings, api } from "@/lib/api";
// api is used directly for delist/update-price calls
import { formatCurrency, formatDateTime, CHANNEL_LABELS } from "@/lib/utils";
import type { Channel } from "@/types";
import { Store, ExternalLink, XCircle, PencilLine } from "lucide-react";

interface Listing {
  id: number;
  product_id: number;
  product_name: string;
  channel_type: string;
  channel_name: string;
  external_id: string;
  status: string;
  listed_price: number;
  listed_at: string;
}

const LISTING_STATUS: Record<string, string> = {
  draft: "下書き",
  active: "出品中",
  sold: "売却済",
  cancelled: "取消",
  error: "エラー",
};

const LISTING_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  sold: "bg-gray-100 text-gray-500",
  draft: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-600",
  error: "bg-red-100 text-red-700",
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  function fetchAll() {
    Promise.all([getChannels(), getListings({ per_page: 200 })])
      .then(([c, l]) => { setChannels(c.data); setListings(l.data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleDelist(listingId: number, productName: string) {
    if (!confirm(`「${productName}」をこのチャネルから取り下げますか？`)) return;
    await api.delete(`/channels/listings/${listingId}`);
    fetchAll();
  }

  async function handleUpdatePrice(listingId: number, currentPrice: number) {
    const input = prompt("新しい出品価格を入力してください", String(currentPrice));
    if (!input || isNaN(Number(input))) return;
    await api.patch(`/channels/listings/${listingId}`, { listed_price: Number(input) });
    fetchAll();
  }

  const filtered = activeChannel === "all"
    ? listings
    : listings.filter((l) => l.channel_type === activeChannel);

  const activeCount = (type: string) =>
    listings.filter((l) => l.channel_type === type && l.status === "active").length;

  return (
    <div className="flex flex-col flex-1">
      <Header title="販路連携" />
      <div className="p-6 space-y-4">
        {/* Channel Cards */}
        <div className="grid grid-cols-4 gap-3">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(c.channel_type)}
              className={`text-left p-4 rounded-xl border transition-colors
                ${activeChannel === c.channel_type
                  ? "border-brand-500 bg-brand-50"
                  : "bg-white border-gray-200 hover:border-brand-300"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Store size={16} className="text-brand-600" />
                <span className="text-sm font-medium text-gray-800">{c.name}</span>
              </div>
              <div className="text-2xl font-bold text-brand-700">{activeCount(c.channel_type)}</div>
              <div className="text-xs text-gray-400">出品中</div>
              {c.fee_rate && (
                <div className="text-xs text-gray-400 mt-1">手数料 {c.fee_rate}%</div>
              )}
            </button>
          ))}
          <button
            onClick={() => setActiveChannel("all")}
            className={`text-left p-4 rounded-xl border transition-colors
              ${activeChannel === "all"
                ? "border-brand-500 bg-brand-50"
                : "bg-white border-gray-200 hover:border-brand-300"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Store size={16} className="text-brand-600" />
              <span className="text-sm font-medium text-gray-800">全チャネル</span>
            </div>
            <div className="text-2xl font-bold text-brand-700">{listings.filter((l) => l.status === "active").length}</div>
            <div className="text-xs text-gray-400">合計出品数</div>
          </button>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">読み込み中...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ExternalLink size={32} className="mx-auto text-gray-300 mb-2" />
              <p>出品なし</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">商品名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">チャネル</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">外部ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">出品価格</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">出品日時</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 truncate max-w-52">{l.product_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-blue-50 text-blue-700">
                        {l.channel_name || CHANNEL_LABELS[l.channel_type] || l.channel_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{l.external_id || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${LISTING_BADGE[l.status] || "bg-gray-100 text-gray-600"}`}>
                        {LISTING_STATUS[l.status] || l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(l.listed_price)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(l.listed_at)}</td>
                    <td className="px-4 py-3">
                      {l.status === "active" && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleUpdatePrice(l.id, l.listed_price)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-600" title="価格変更">
                            <PencilLine size={14} />
                          </button>
                          <button onClick={() => handleDelist(l.id, l.product_name)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" title="取り下げ">
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
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
