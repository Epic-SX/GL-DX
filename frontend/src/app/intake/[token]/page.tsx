"use client";

import { useState } from "react";
import { Package, Camera, CheckCircle, Upload, ArrowLeft } from "lucide-react";

const CATEGORIES = ["カメラ", "スマートフォン", "ゲーム", "腕時計", "バッグ", "家電・PC", "オーディオ", "ブランド品", "その他"];
const CONDITIONS = [
  { value: "S", label: "未使用", desc: "開封未使用品" },
  { value: "A", label: "極美品", desc: "使用感ほぼなし" },
  { value: "B", label: "美品",   desc: "若干の使用感あり" },
  { value: "C", label: "良品",   desc: "使用感あり" },
  { value: "D", label: "訳あり", desc: "傷・汚れ等あり" },
];

export default function IntakePage({ params }: { params: { token: string } }) {
  const [step, setStep] = useState<"form" | "done">("form");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    item_name: "", brand: "", category: "", condition: "A",
    estimated_price: "", quantity: "1", notes: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">申請が完了しました</h2>
          <p className="text-gray-500 text-sm mb-6">
            入庫申請を本部に送信しました。<br />
            査定結果はメールまたは本部からご連絡します。
          </p>
          <button onClick={() => { setStep("form"); setForm({ item_name: "", brand: "", category: "", condition: "A", estimated_price: "", quantity: "1", notes: "" }); setImages([]); }}
            className="flex items-center gap-2 text-sm text-brand-700 hover:underline mx-auto">
            <ArrowLeft size={14} /> 続けて申請する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">GL</span>
          </div>
          <div>
            <div className="font-bold text-sm text-gray-800">GL DX System</div>
            <div className="text-xs text-gray-400">FC店舗 入庫申請フォーム</div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 text-xs text-blue-700">
          このフォームは <strong>ポータルID: {params.token.slice(0, 12)}...</strong> に紐付いています。
          商品の入庫申請情報を入力して本部に送信してください。
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 商品情報 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-base flex items-center gap-2">
              <Package size={18} className="text-brand-600" /> 商品情報
            </h2>

            <Field label="商品名 *">
              <input name="item_name" value={form.item_name} onChange={handleChange} required
                className="input w-full" placeholder="例: Canon EOS R5 ボディ" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="ブランド">
                <input name="brand" value={form.brand} onChange={handleChange}
                  className="input w-full" placeholder="Apple, Rolex など" />
              </Field>
              <Field label="カテゴリ *">
                <select name="category" value={form.category} onChange={handleChange} required className="input w-full">
                  <option value="">選択...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            <Field label="状態 *">
              <div className="grid grid-cols-5 gap-2">
                {CONDITIONS.map((c) => (
                  <label key={c.value} className={`text-center p-2 rounded-lg border cursor-pointer transition-colors text-xs ${form.condition === c.value ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-300 hover:border-brand-400"}`}>
                    <input type="radio" name="condition" value={c.value} checked={form.condition === c.value} onChange={handleChange} className="sr-only" />
                    <div className="font-bold">{c.value}</div>
                    <div className="mt-0.5">{c.label}</div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">{CONDITIONS.find((c) => c.value === form.condition)?.desc}</p>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="概算査定額 (¥)">
                <input name="estimated_price" type="number" value={form.estimated_price} onChange={handleChange}
                  className="input w-full" placeholder="0" min="0" />
              </Field>
              <Field label="数量">
                <input name="quantity" type="number" value={form.quantity} onChange={handleChange}
                  className="input w-full" min="1" max="99" />
              </Field>
            </div>

            <Field label="備考・状態詳細">
              <textarea name="notes" value={form.notes} onChange={handleChange}
                className="input w-full resize-none" rows={3}
                placeholder="付属品、傷・汚れの詳細、特記事項など" />
            </Field>
          </div>

          {/* 商品画像 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-800 text-base flex items-center gap-2">
              <Camera size={18} className="text-brand-600" /> 商品画像
            </h2>
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-400 transition-colors">
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">タップして画像を選択（複数可）</span>
              <input type="file" accept="image/*" multiple className="sr-only"
                onChange={(e) => setImages(Array.from(e.target.files || []))} />
            </label>
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((f, i) => (
                  <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">全体・正面・裏面・傷箇所を撮影してください</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-brand-700 text-white rounded-xl font-semibold text-base hover:bg-brand-800 disabled:opacity-50 transition-colors">
            {loading ? "送信中..." : "本部に入庫申請を送信"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
