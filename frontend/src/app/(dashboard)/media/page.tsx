"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { getMediaGallery } from "@/lib/api";
import { Copy, Check, X, Search, FolderOpen } from "lucide-react";

interface MediaItem {
  id: number; product_id: number; product_name: string; brand: string;
  category: string; url: string; is_primary: boolean; filename: string; uploaded_at: string;
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);

  useEffect(() => { getMediaGallery().then((r) => setItems(r.data)); }, []);

  const categories = Array.from(new Set(items.map((i) => i.category))).sort();

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchQ = !q || item.product_name.toLowerCase().includes(q) || item.brand?.toLowerCase().includes(q);
    const matchCat = !categoryFilter || item.category === categoryFilter;
    return matchQ && matchCat;
  });

  async function copyUrl(item: MediaItem) {
    await navigator.clipboard.writeText(item.url).catch(() => {});
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="メディアギャラリー" />
      <div className="p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>📁 画像データ蓄積について:</strong> 本番環境では
          <strong> AWS S3 / Google Cloud Storage</strong> との連携により、商品登録時に自動で画像がクラウドに保存・整理されます。
          各画像のURLはDXシステム全体で共通利用できます。
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="商品名・ブランドで検索"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">全カテゴリ</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="text-sm text-gray-500 ml-auto">{filtered.length} 件の画像</div>
        </div>

        {/* Gallery Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FolderOpen size={48} className="mb-3 text-gray-300" />
            <p>画像が見つかりません</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="relative aspect-square cursor-pointer" onClick={() => setLightbox(item)}>
                  <img src={item.url} alt={item.product_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  {item.is_primary && (
                    <span className="absolute top-2 left-2 badge bg-brand-600 text-white text-xs">メイン</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-xs font-medium text-gray-800 truncate">{item.product_name}</div>
                  <div className="text-xs text-gray-400 truncate">{item.filename}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge bg-gray-100 text-gray-500 text-xs">{item.category}</span>
                    <button onClick={() => copyUrl(item)}
                      className={`ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${copiedId === item.id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {copiedId === item.id ? <><Check size={10} />コピー済</> : <><Copy size={10} />URL</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightbox && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setLightbox(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors">
                <X size={28} />
              </button>
              <img src={lightbox.url} alt={lightbox.product_name} className="w-full rounded-xl" />
              <div className="bg-white rounded-b-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">{lightbox.product_name}</div>
                  <div className="text-xs text-gray-400">{lightbox.filename}</div>
                </div>
                <button onClick={() => copyUrl(lightbox)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${copiedId === lightbox.id ? "bg-green-100 text-green-700" : "bg-brand-100 text-brand-700 hover:bg-brand-200"}`}>
                  {copiedId === lightbox.id ? <><Check size={14} />コピー済み</> : <><Copy size={14} />URLコピー</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
