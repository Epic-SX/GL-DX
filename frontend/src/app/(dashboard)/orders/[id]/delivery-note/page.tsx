"use client";

import { useEffect, useState } from "react";
import { getOrder } from "@/lib/api";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

const CHECKLIST_ITEMS = [
  "外観（傷・汚れ・割れ）確認",
  "付属品の有無確認",
  "動作確認（電源ON/機能テスト）",
  "シリアル番号照合",
  "クリーニング済み",
  "梱包材の確認",
  "伝票・納品書同梱確認",
];

interface Order {
  id: number; order_number: string; status: string;
  buyer_name: string; buyer_email?: string; buyer_address?: string; buyer_postal_code?: string;
  product_id: number; product_name: string; channel_type: string;
  sale_price: number; shipping_fee: number; platform_fee: number; net_revenue: number; gross_profit: number;
  ordered_at: string; completed_at?: string;
}

export default function DeliveryNotePage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [checks, setChecks] = useState<boolean[]>(CHECKLIST_ITEMS.map(() => false));
  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    getOrder(Number(params.id)).then((r) => setOrder(r.data));
  }, [params.id]);

  if (!order) return <div className="p-10 text-center text-gray-400">読み込み中...</div>;

  const subtotal = order.sale_price;
  const shipping = order.shipping_fee || 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print controls - hidden when printing */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <Link href={`/orders/${params.id}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-700">
          <ArrowLeft size={15} /> 受注詳細に戻る
        </Link>
        <button onClick={() => window.print()}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-brand-700 text-white rounded-lg text-sm font-medium hover:bg-brand-800">
          <Printer size={15} /> 印刷 / PDF保存
        </button>
      </div>

      {/* A4 Paper */}
      <div className="max-w-3xl mx-auto my-6 print:my-0 bg-white shadow-lg print:shadow-none p-10 print:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-3xl font-bold text-gray-800 mb-1">納品書</div>
            <div className="text-sm text-gray-500">DELIVERY NOTE</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-800">GL株式会社</div>
            <div className="text-xs text-gray-500 mt-1">
              〒150-0001 東京都渋谷区渋谷1-1-1<br />
              TEL: 03-0000-0000<br />
              Email: info@gl.co.jp
            </div>
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="space-y-1 text-sm">
            <div className="font-semibold text-gray-800 mb-2">お届け先</div>
            <div className="font-bold text-gray-900 text-base">{order.buyer_name} 様</div>
            {order.buyer_postal_code && <div className="text-gray-600">〒{order.buyer_postal_code}</div>}
            {order.buyer_address && <div className="text-gray-600">{order.buyer_address}</div>}
            {order.buyer_email && <div className="text-gray-500 text-xs">{order.buyer_email}</div>}
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">納品書番号</span><strong>{order.order_number}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">発行日</span><strong>{today}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">受注日</span><strong>{new Date(order.ordered_at).toLocaleDateString("ja-JP")}</strong></div>
            <div className="flex justify-between"><span className="text-gray-500">販売チャネル</span><strong>{order.channel_type}</strong></div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-6 border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left py-2.5 px-3 font-medium">商品名</th>
              <th className="text-center py-2.5 px-3 font-medium w-16">数量</th>
              <th className="text-right py-2.5 px-3 font-medium w-32">単価</th>
              <th className="text-right py-2.5 px-3 font-medium w-32">金額</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-3 px-3 text-gray-800">{order.product_name}</td>
              <td className="py-3 px-3 text-center">1</td>
              <td className="py-3 px-3 text-right">¥{subtotal.toLocaleString()}</td>
              <td className="py-3 px-3 text-right font-medium">¥{subtotal.toLocaleString()}</td>
            </tr>
            {shipping > 0 && (
              <tr className="border-b border-gray-200">
                <td className="py-3 px-3 text-gray-800">送料</td>
                <td className="py-3 px-3 text-center">1</td>
                <td className="py-3 px-3 text-right">¥{shipping.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-medium">¥{shipping.toLocaleString()}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={3} className="py-2.5 px-3 text-right font-medium text-gray-700">小計</td>
              <td className="py-2.5 px-3 text-right font-medium">¥{subtotal.toLocaleString()}</td>
            </tr>
            <tr className="bg-gray-50">
              <td colSpan={3} className="py-2.5 px-3 text-right font-medium text-gray-700">送料</td>
              <td className="py-2.5 px-3 text-right font-medium">¥{shipping.toLocaleString()}</td>
            </tr>
            <tr className="bg-gray-800 text-white">
              <td colSpan={3} className="py-3 px-3 text-right font-bold text-base">合計金額</td>
              <td className="py-3 px-3 text-right font-bold text-base">¥{total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        {/* Inspection Checklist (⑥) */}
        <div className="border border-gray-300 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">検品チェックリスト</h3>
          <div className="grid grid-cols-2 gap-y-2 gap-x-6">
            {CHECKLIST_ITEMS.map((item, i) => (
              <label key={i} className="flex items-center gap-2.5 text-sm cursor-pointer print:cursor-default">
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={(e) => setChecks((prev) => { const n = [...prev]; n[i] = e.target.checked; return n; })}
                  className="w-4 h-4 rounded border-gray-400 text-brand-600 print:appearance-none print:w-4 print:h-4 print:border print:border-gray-400 print:rounded"
                />
                <span className={checks[i] ? "line-through text-gray-400" : "text-gray-700"}>{item}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-gray-500">検品担当者:</span>
            <span className="border-b border-gray-400 w-40 inline-block">&nbsp;</span>
            <span className="text-gray-500 ml-6">検品日:</span>
            <span className="border-b border-gray-400 w-32 inline-block">&nbsp;</span>
          </div>
        </div>

        {/* Notes */}
        <div className="border border-gray-200 rounded-xl p-4 mb-8">
          <h3 className="font-semibold text-gray-800 mb-2 text-sm">備考・同梱レター</h3>
          <div className="text-sm text-gray-600 space-y-1.5">
            <p>この度はご購入いただきありがとうございます。</p>
            <p>商品に万が一不具合がございましたら、お気軽にお問い合わせください。</p>
            <p className="text-xs text-gray-400 mt-2">お問い合わせ: info@gl.co.jp / 03-0000-0000（平日10:00〜18:00）</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          GL DX System — 本書は電子発行された納品書です / {today}
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
