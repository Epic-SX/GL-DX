"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { getClients, createClient, updateClient, deleteClient } from "@/lib/api";
import type { Client, ClientType } from "@/types";
import { Users, Plus, Search, Phone, Mail, MapPin, Building2, X, Check } from "lucide-react";

const CLIENT_TYPE_LABELS: Record<string, string> = {
  wholesale: "卸業者",
  consult: "コンサル",
  auction_house: "オークション業者",
  direct: "直販顧客",
  other: "その他",
};

const CLIENT_TYPE_COLORS: Record<string, string> = {
  wholesale: "bg-blue-100 text-blue-700",
  consult: "bg-purple-100 text-purple-700",
  auction_house: "bg-orange-100 text-orange-700",
  direct: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-600",
};

const EMPTY_FORM = {
  name: "", company: "", client_type: "other" as ClientType,
  email: "", phone: "", fax: "",
  postal_code: "", prefecture: "", city: "", address: "",
  payment_terms: "", credit_limit: "", notes: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { active_only: true };
      if (q) params.q = q;
      if (typeFilter) params.client_type = typeFilter;
      const res = await getClients(params);
      setClients(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [q, typeFilter]);

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(c: Client) {
    setEditId(c.id);
    setForm({
      name: c.name, company: c.company || "", client_type: c.client_type,
      email: c.email || "", phone: c.phone || "", fax: c.fax || "",
      postal_code: c.postal_code || "", prefecture: c.prefecture || "",
      city: c.city || "", address: c.address || "",
      payment_terms: c.payment_terms || "",
      credit_limit: c.credit_limit?.toString() || "",
      notes: c.notes || "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { alert("氏名を入力してください"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        credit_limit: form.credit_limit ? parseInt(form.credit_limit) : null,
      };
      if (editId) {
        await updateClient(editId, payload);
      } else {
        await createClient(payload);
      }
      setShowForm(false);
      load();
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("このクライアントを無効化しますか？")) return;
    await deleteClient(id);
    load();
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="クライアント管理" />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 w-full"
              placeholder="氏名・会社名・電話で検索..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">すべての種別</option>
            {Object.entries(CLIENT_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />新規クライアント
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card h-20 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>クライアントがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {clients.map((c) => (
              <div key={c.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-brand-700 font-bold text-sm">
                        {(c.company || c.name).charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{c.company || c.name}</div>
                      {c.company && <div className="text-sm text-gray-500 truncate">{c.name}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge text-xs ${CLIENT_TYPE_COLORS[c.client_type]}`}>
                      {CLIENT_TYPE_LABELS[c.client_type]}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-gray-400" />
                      {c.phone}
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-gray-400" />
                      {c.email}
                    </div>
                  )}
                  {(c.prefecture || c.city) && (
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-gray-400" />
                      {c.prefecture}{c.city}
                    </div>
                  )}
                  {c.payment_terms && (
                    <div className="flex items-center gap-2">
                      <Building2 size={13} className="text-gray-400" />
                      {c.payment_terms}
                    </div>
                  )}
                  {c.notes && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => openEdit(c)} className="btn-secondary text-xs flex-1">
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    無効化
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">
                {editId ? "クライアント編集" : "新規クライアント登録"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">氏名 *</label>
                  <input className="input w-full" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="山田 太郎" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">会社名</label>
                  <input className="input w-full" value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} placeholder="株式会社〇〇" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">種別</label>
                  <select className="input w-full" value={form.client_type} onChange={(e) => setForm({...form, client_type: e.target.value as ClientType})}>
                    {Object.entries(CLIENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">電話番号</label>
                  <input className="input w-full" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="090-0000-0000" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">メールアドレス</label>
                  <input className="input w-full" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="example@email.com" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">FAX</label>
                  <input className="input w-full" value={form.fax} onChange={(e) => setForm({...form, fax: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">郵便番号</label>
                  <input className="input w-full" value={form.postal_code} onChange={(e) => setForm({...form, postal_code: e.target.value})} placeholder="000-0000" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">都道府県</label>
                  <input className="input w-full" value={form.prefecture} onChange={(e) => setForm({...form, prefecture: e.target.value})} placeholder="東京都" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">住所</label>
                  <input className="input w-full" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} placeholder="市区町村・番地" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">支払条件</label>
                  <input className="input w-full" value={form.payment_terms} onChange={(e) => setForm({...form, payment_terms: e.target.value})} placeholder="月末締め翌月末払い" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">与信限度額（円）</label>
                  <input className="input w-full" type="number" value={form.credit_limit} onChange={(e) => setForm({...form, credit_limit: e.target.value})} placeholder="1000000" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">備考</label>
                  <textarea className="input w-full h-20 resize-none" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">キャンセル</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                <Check size={16} />
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
