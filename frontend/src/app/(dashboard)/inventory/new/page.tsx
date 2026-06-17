"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { createProduct, uploadProductImage } from "@/lib/api";
import { ArrowLeft, Upload, Barcode } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  "ゲーム・ホビー", "家電・PC", "カメラ", "スマートフォン",
  "ブランド品", "時計・宝飾", "スポーツ", "アパレル",
  "楽器", "おもちゃ", "本・漫画", "CD・DVD", "その他",
];

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    brand: "",
    model_number: "",
    category: "",
    jan_code: "",
    condition: "A",
    cost_price: "",
    selling_price: "",
    shelf_location: "",
    acquired_from: "",
    acquired_date: "",
    accessories: "",
    condition_notes: "",
    description: "",
    internal_notes: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        cost_price: parseFloat(form.cost_price),
        selling_price: parseFloat(form.selling_price),
        jan_code: form.jan_code || undefined,
        brand: form.brand || undefined,
        model_number: form.model_number || undefined,
        category: form.category || undefined,
        shelf_location: form.shelf_location || undefined,
        acquired_from: form.acquired_from || undefined,
        acquired_date: form.acquired_date || undefined,
      };
      const res = await createProduct(payload);
      const productId = res.data.id;

      for (let i = 0; i < images.length; i++) {
        await uploadProductImage(productId, images[i], i === 0);
      }

      router.push(`/inventory/${productId}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="商品登録" />
      <div className="p-6 max-w-3xl">
        <Link href="/inventory" className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 mb-4">
          <ArrowLeft size={16} />
          在庫一覧に戻る
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* 基本情報 */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-800 text-base border-b pb-2">基本情報</h2>
            <Field label="商品名 *">
              <input name="name" value={form.name} onChange={handleChange} required
                className="input w-full" placeholder="商品名を入力" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="ブランド">
                <input name="brand" value={form.brand} onChange={handleChange}
                  className="input w-full" placeholder="Apple, SONY など" />
              </Field>
              <Field label="型番・モデル">
                <input name="model_number" value={form.model_number} onChange={handleChange}
                  className="input w-full" placeholder="型番を入力" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="カテゴリ">
                <select name="category" value={form.category} onChange={handleChange} className="input w-full">
                  <option value="">選択してください</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="JANコード">
                <div className="relative">
                  <Barcode size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="jan_code" value={form.jan_code} onChange={handleChange}
                    className="input w-full pl-8" placeholder="4901234567890" maxLength={13} />
                </div>
              </Field>
            </div>
          </div>

          {/* 状態・価格 */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-800 text-base border-b pb-2">状態・価格</h2>
            <Field label="状態 *">
              <div className="flex gap-2">
                {["S", "A", "B", "C", "D"].map((c) => (
                  <label key={c} className={`flex-1 text-center py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors
                    ${form.condition === c ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-300 hover:border-brand-400"}`}>
                    <input type="radio" name="condition" value={c}
                      checked={form.condition === c} onChange={handleChange} className="sr-only" />
                    {c === "S" ? "未使用" : c === "A" ? "極美品" : c === "B" ? "美品" : c === "C" ? "良品" : "訳あり"}
                  </label>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="仕入原価 (¥) *">
                <input name="cost_price" type="number" value={form.cost_price} onChange={handleChange}
                  required min="0" className="input w-full" placeholder="0" />
              </Field>
              <Field label="販売価格 (¥) *">
                <input name="selling_price" type="number" value={form.selling_price} onChange={handleChange}
                  required min="0" className="input w-full" placeholder="0" />
              </Field>
            </div>
            {form.cost_price && form.selling_price && (
              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                想定粗利: <span className="font-medium text-brand-700">
                  ¥{(parseFloat(form.selling_price) - parseFloat(form.cost_price)).toLocaleString()}
                </span>
                {" "}(利益率: {((1 - parseFloat(form.cost_price) / parseFloat(form.selling_price)) * 100).toFixed(1)}%)
              </div>
            )}
          </div>

          {/* 在庫情報 */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-800 text-base border-b pb-2">在庫・仕入情報</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="棚番号">
                <input name="shelf_location" value={form.shelf_location} onChange={handleChange}
                  className="input w-full" placeholder="A-2-3" />
              </Field>
              <Field label="仕入先">
                <input name="acquired_from" value={form.acquired_from} onChange={handleChange}
                  className="input w-full" placeholder="仕入先名" />
              </Field>
            </div>
            <Field label="仕入日">
              <input name="acquired_date" type="date" value={form.acquired_date} onChange={handleChange}
                className="input w-full" />
            </Field>
            <Field label="付属品">
              <input name="accessories" value={form.accessories} onChange={handleChange}
                className="input w-full" placeholder="箱、説明書、充電器など" />
            </Field>
            <Field label="状態詳細">
              <textarea name="condition_notes" value={form.condition_notes} onChange={handleChange}
                rows={2} className="input w-full resize-none"
                placeholder="傷・汚れなどの詳細を記入" />
            </Field>
            <Field label="内部メモ">
              <textarea name="internal_notes" value={form.internal_notes} onChange={handleChange}
                rows={2} className="input w-full resize-none" placeholder="スタッフ向けメモ" />
            </Field>
          </div>

          {/* 画像 */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-800 text-base border-b pb-2">商品画像</h2>
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 transition-colors">
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">クリックして画像を選択（複数可）</span>
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
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary px-8 disabled:opacity-50">
              {loading ? "登録中..." : "商品を登録"}
            </button>
            <Link href="/inventory" className="btn-secondary">キャンセル</Link>
          </div>
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
