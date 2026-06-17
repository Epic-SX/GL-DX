"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { getProduct, updateProduct, getChannels, bulkListProduct, getEbayStatus, getEbayAuthUrl, previewEbayTranslation, listOnEbay } from "@/lib/api";
import { formatCurrency, formatDate, CONDITION_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import type { Product, Channel } from "@/types";
import Link from "next/link";
import { ArrowLeft, Package, Tag, MapPin, ExternalLink, Globe } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [listPrice, setListPrice] = useState("");
  const [listing, setListing] = useState(false);

  // eBay state
  const [ebayConnected, setEbayConnected] = useState(false);
  const [ebayConfigured, setEbayConfigured] = useState(false);
  const [ebayTranslation, setEbayTranslation] = useState<{title_en: string; description_en: string; deepl_configured: boolean} | null>(null);
  const [ebayUsdPrice, setEbayUsdPrice] = useState("");
  const [ebayListing, setEbayListing] = useState(false);
  const [ebayResult, setEbayResult] = useState<{listing_url: string; title_en: string} | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    Promise.all([
      getProduct(Number(id)),
      getChannels(),
      getEbayStatus(),
    ]).then(([p, c, e]) => {
      setProduct(p.data);
      setListPrice(p.data.selling_price.toString());
      setChannels(c.data);
      setEbayConnected(e.data.connected);
      setEbayConfigured(e.data.configured);
      // Suggest USD price: selling_price / 150 (approx JPY→USD rate)
      const suggestedUsd = Math.ceil(p.data.selling_price / 150);
      setEbayUsdPrice(suggestedUsd.toString());
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleEbayPreview() {
    if (!product) return;
    setTranslating(true);
    try {
      const res = await previewEbayTranslation(product.id);
      setEbayTranslation(res.data);
    } catch {
      alert("翻訳プレビューの取得に失敗しました");
    } finally {
      setTranslating(false);
    }
  }

  async function handleEbayList() {
    if (!product || !ebayUsdPrice) return;
    setEbayListing(true);
    try {
      const res = await listOnEbay(product.id, parseFloat(ebayUsdPrice));
      setEbayResult(res.data);
      alert(`eBayへの出品が完了しました！\nリスティングURL: ${res.data.listing_url || "（ID: " + res.data.listing_id + "）"}`);
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "eBay出品に失敗しました");
    } finally {
      setEbayListing(false);
    }
  }

  async function handleBulkList() {
    if (!product || selectedChannels.length === 0) return;
    setListing(true);
    try {
      await bulkListProduct(product.id, selectedChannels, parseFloat(listPrice));
      alert(`${selectedChannels.length}チャネルに出品しました`);
      const res = await getProduct(product.id);
      setProduct(res.data);
    } catch (e: unknown) {
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "出品に失敗しました");
    } finally {
      setListing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="商品詳細" />
        <div className="p-6">
          <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="flex flex-col flex-1">
      <Header title="商品詳細" />
      <div className="p-6 space-y-4 max-w-5xl">
        <Link href="/inventory" className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600">
          <ArrowLeft size={16} />在庫一覧に戻る
        </Link>

        <div className="grid grid-cols-3 gap-6">
          {/* Images */}
          <div className="space-y-3">
            {product.images.length > 0 ? (
              <img
                src={`${API_URL}${product.images.find((i) => i.is_primary)?.url || product.images[0].url}`}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-xl border border-gray-200"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                <Package size={48} className="text-gray-300" />
              </div>
            )}
            {product.images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {product.images.slice(1).map((img) => (
                  <img
                    key={img.id}
                    src={`${API_URL}${img.url}`}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="col-span-2 space-y-4">
            <div className="card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
                  {product.brand && <p className="text-sm text-gray-500">{product.brand}</p>}
                </div>
                <span className={`badge ${STATUS_COLORS[product.status]}`}>
                  {STATUS_LABELS[product.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="SKU" value={<code className="font-mono">{product.sku}</code>} />
                <InfoRow label="JANコード" value={product.jan_code || "-"} />
                <InfoRow label="状態" value={CONDITION_LABELS[product.condition]} />
                <InfoRow label="カテゴリ" value={product.category || "-"} />
                <InfoRow label="販売価格" value={
                  <span className="text-brand-700 font-bold text-base">
                    {formatCurrency(product.selling_price)}
                  </span>
                } />
                <InfoRow label="仕入原価" value={formatCurrency(product.cost_price)} />
                <InfoRow label="想定粗利" value={
                  <span className="text-green-700 font-medium">
                    {formatCurrency(product.selling_price - product.cost_price)}
                  </span>
                } />
                <InfoRow label="棚番号" value={
                  product.shelf_location
                    ? <span className="flex items-center gap-1"><MapPin size={13} />{product.shelf_location}</span>
                    : "-"
                } />
                <InfoRow label="仕入日" value={formatDate(product.acquired_date)} />
                {product.days_in_stock != null && (
                  <InfoRow label="滞留日数" value={
                    <span className={product.days_in_stock > 30 ? "text-orange-600 font-medium" : ""}>
                      {product.days_in_stock}日
                    </span>
                  } />
                )}
              </div>

              {product.accessories && (
                <div className="text-sm">
                  <span className="font-medium text-gray-600">付属品:</span>{" "}
                  <span className="text-gray-700">{product.accessories}</span>
                </div>
              )}
              {product.condition_notes && (
                <div className="text-sm">
                  <span className="font-medium text-gray-600">状態詳細:</span>{" "}
                  <span className="text-gray-700">{product.condition_notes}</span>
                </div>
              )}
            </div>

            {/* EC出品 */}
            {product.status !== "sold" && (
              <div className="card space-y-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <ExternalLink size={16} />
                  複数チャネルに一括出品
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {channels.filter((c) => c.is_active).map((c) => (
                    <label key={c.id} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-colors
                      ${selectedChannels.includes(c.id)
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 hover:border-brand-300"}`}>
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(c.id)}
                        onChange={(e) => setSelectedChannels(prev =>
                          e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)
                        )}
                        className="rounded border-gray-300 text-brand-600"
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">出品価格:</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">¥</span>
                      <input
                        type="number"
                        value={listPrice}
                        onChange={(e) => setListPrice(e.target.value)}
                        className="input pl-7 w-36"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleBulkList}
                    disabled={listing || selectedChannels.length === 0}
                    className="btn-primary disabled:opacity-50"
                  >
                    {listing ? "出品中..." : `${selectedChannels.length}チャネルに出品`}
                  </button>
                </div>
              </div>
            )}

            {/* eBay 国際出品 */}
            {product.status !== "sold" && (
              <div className="card space-y-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Globe size={16} className="text-blue-500" />
                  eBay 国際出品
                  <span className="text-xs font-normal text-gray-400 ml-1">（海外向け・多言語・自動翻訳）</span>
                </h3>

                {!ebayConfigured ? (
                  <p className="text-sm text-orange-600">
                    eBay Developer API キーが未設定です。<br />
                    .env に <code className="bg-gray-100 px-1 rounded text-xs">EBAY_APP_ID</code> / <code className="bg-gray-100 px-1 rounded text-xs">EBAY_CERT_ID</code> を設定してください。
                  </p>
                ) : !ebayConnected ? (
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      eBay OAuth 未連携です。GL管理者が下記から認証を行ってください。
                    </p>
                    <button
                      className="btn-secondary text-sm"
                      onClick={async () => {
                        try {
                          const res = await getEbayAuthUrl();
                          window.open(res.data.url, "_blank");
                        } catch {
                          alert("認証URLの取得に失敗しました");
                        }
                      }}
                    >
                      eBay OAuth 認証を開始
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      eBay 連携済み
                    </div>

                    {/* Translation preview */}
                    {!ebayTranslation ? (
                      <button
                        className="btn-secondary text-sm"
                        onClick={handleEbayPreview}
                        disabled={translating}
                      >
                        {translating ? "翻訳中..." : "英語翻訳プレビューを取得"}
                      </button>
                    ) : (
                      <div className="space-y-2 bg-blue-50 rounded-lg p-3 text-sm">
                        {!ebayTranslation.deepl_configured && (
                          <p className="text-xs text-orange-500 mb-1">DeepL未設定のためそのまま表示。DEEPL_API_KEYを設定すると自動翻訳されます。</p>
                        )}
                        <div>
                          <span className="text-xs text-gray-500 font-medium">タイトル (EN):</span>
                          <p className="text-gray-800 font-medium mt-0.5">{ebayTranslation.title_en}</p>
                        </div>
                        {ebayTranslation.description_en && (
                          <div>
                            <span className="text-xs text-gray-500 font-medium">説明文 (EN):</span>
                            <p className="text-gray-700 mt-0.5 whitespace-pre-line text-xs leading-relaxed line-clamp-4">
                              {ebayTranslation.description_en}
                            </p>
                          </div>
                        )}
                        <button className="text-xs text-blue-500 underline" onClick={() => setEbayTranslation(null)}>
                          再取得
                        </button>
                      </div>
                    )}

                    {/* USD price + list button */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">USD価格:</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={ebayUsdPrice}
                            onChange={(e) => setEbayUsdPrice(e.target.value)}
                            className="input pl-7 w-32"
                            placeholder="99.99"
                          />
                        </div>
                        {ebayUsdPrice && (
                          <span className="text-xs text-gray-400">
                            ≈ {formatCurrency(parseFloat(ebayUsdPrice) * 150)}（150円/USD）
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handleEbayList}
                        disabled={ebayListing || !ebayUsdPrice}
                        className="btn-primary disabled:opacity-50 flex items-center gap-2 text-sm"
                      >
                        <Globe size={14} />
                        {ebayListing ? "出品中..." : "eBayに出品"}
                      </button>
                    </div>

                    {ebayResult?.listing_url && (
                      <a
                        href={ebayResult.listing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <ExternalLink size={13} />
                        eBayリスティングを確認
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Link href={`/inventory/${product.id}?edit=1`} className="btn-primary">
                編集
              </Link>
              <Link href="/orders/new" className="btn-secondary">
                この商品を売却登録
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-gray-400 text-xs">{label}</span>
      <div className="text-gray-800 mt-0.5">{value}</div>
    </div>
  );
}
