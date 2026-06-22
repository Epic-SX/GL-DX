"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { getFcStores, generateFcPortalUrl, getIntakeRequests, updateIntakeRequest } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Building2, Copy, Check, RefreshCw, Plus, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";

interface FcStore { id: number; store_name: string; owner_name: string; email: string; phone: string; portal_token: string | null; portal_active: boolean; last_intake: string | null; intake_count: number; status: string; }
interface IntakeRequest { id: number; store_name: string; store_id: number; item_name: string; brand: string; category: string; condition: string; estimated_price: number; quantity: number; submitted_at: string; notes: string; status: string; images?: string[]; }

const STATUS_BADGE: Record<string, string> = { active: "bg-green-100 text-green-700", pending: "bg-yellow-100 text-yellow-700" };
const INTAKE_BADGE: Record<string, string> = { pending: "bg-blue-100 text-blue-700", accepted: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-500" };
const INTAKE_LABEL: Record<string, string> = { pending: "確認待ち", accepted: "受入済", rejected: "却下" };
const CONDITION_JP: Record<string, string> = { S: "未使用", A: "極美品", B: "美品", C: "良品", D: "訳あり" };

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://yourapp.vercel.app";

export default function FcPortalPage() {
  const [tab, setTab] = useState<"stores" | "intake">("stores");
  const [stores, setStores] = useState<FcStore[]>([]);
  const [requests, setRequests] = useState<IntakeRequest[]>([]);
  const [intakeFilter, setIntakeFilter] = useState("pending");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    getFcStores().then((r) => setStores(r.data));
  }, []);

  useEffect(() => {
    if (tab === "intake") {
      getIntakeRequests(intakeFilter || undefined).then((r) => setRequests(r.data));
    }
  }, [tab, intakeFilter]);

  async function handleGenerateUrl(storeId: number) {
    setGeneratingId(storeId);
    try {
      const r = await generateFcPortalUrl(storeId);
      setStores((prev) => prev.map((s) => s.id === storeId ? { ...s, portal_token: r.data.portal_token, portal_active: true } : s));
    } finally { setGeneratingId(null); }
  }

  async function copyUrl(token: string, storeId: number) {
    const url = `${BASE_URL}/intake/${token}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopiedId(storeId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleIntakeAction(id: number, status: "accepted" | "rejected") {
    setActionId(id);
    try {
      await updateIntakeRequest(id, { status });
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    } finally { setActionId(null); }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="flex flex-col flex-1">
      <Header title="FC管理" />
      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          <button onClick={() => setTab("stores")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "stores" ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            FC店舗一覧
          </button>
          <button onClick={() => setTab("intake")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === "intake" ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            入庫申請
            {pendingCount > 0 && tab !== "intake" && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">{pendingCount}</span>
            )}
          </button>
        </div>

        {/* ─── Tab 1: FC Store List ─── */}
        {tab === "stores" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>FC店舗ポータルURL</strong>とは、各FC店が本部に商品の入庫申請を行うための専用URLです。
              URLを発行してFC店オーナーに共有してください。ログイン不要で簡易フォームから申請できます。
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-800">FC店舗一覧</h2>
                <button className="btn-primary flex items-center gap-2 text-sm">
                  <Plus size={15} /> 新規FC店追加
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {stores.map((store) => {
                  const portalUrl = store.portal_token ? `${BASE_URL}/intake/${store.portal_token}` : null;
                  return (
                    <div key={store.id} className="py-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                        <Building2 size={20} className="text-brand-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">{store.store_name}</span>
                          <span className={`badge ${STATUS_BADGE[store.status] || "bg-gray-100 text-gray-500"}`}>
                            {store.status === "active" ? "稼働中" : "準備中"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">{store.owner_name} / {store.email} / {store.phone}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          入庫申請数: {store.intake_count}件
                          {store.last_intake && ` / 最終申請: ${store.last_intake}`}
                        </div>

                        {/* Portal URL */}
                        <div className="mt-3">
                          {portalUrl ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-600 truncate">
                                {portalUrl}
                              </div>
                              <button onClick={() => copyUrl(store.portal_token!, store.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${copiedId === store.id ? "bg-green-100 text-green-700" : "bg-brand-100 text-brand-700 hover:bg-brand-200"}`}>
                                {copiedId === store.id ? <><Check size={12} />コピー済み</> : <><Copy size={12} />URLコピー</>}
                              </button>
                              <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
                                <ExternalLink size={14} />
                              </a>
                            </div>
                          ) : (
                            <button onClick={() => handleGenerateUrl(store.id)} disabled={generatingId === store.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 disabled:opacity-50">
                              {generatingId === store.id ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                              ポータルURL発行
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab 2: Intake Requests ─── */}
        {tab === "intake" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {["", "pending", "accepted", "rejected"].map((s) => (
                <button key={s} onClick={() => setIntakeFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${intakeFilter === s ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {s === "" ? "全て" : s === "pending" ? "確認待ち" : s === "accepted" ? "受入済" : "却下"}
                </button>
              ))}
            </div>

            <div className="card">
              <h2 className="text-base font-semibold text-gray-800 mb-4">入庫申請一覧</h2>
              {requests.length === 0 ? (
                <div className="text-center py-10 text-gray-400">申請がありません</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {requests.map((req) => (
                    <div key={req.id} className="py-4 flex items-start gap-4">
                      {req.images?.[0] && (
                        <img src={req.images[0]} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-gray-800">{req.item_name}</span>
                          <span className={`badge ${INTAKE_BADGE[req.status]}`}>{INTAKE_LABEL[req.status]}</span>
                        </div>
                        <div className="text-sm text-gray-500 flex gap-4 flex-wrap">
                          <span>申請店舗: <strong>{req.store_name}</strong></span>
                          <span>カテゴリ: {req.category}</span>
                          <span>状態: {CONDITION_JP[req.condition] || req.condition}</span>
                          <span>数量: {req.quantity}点</span>
                          <span>概算: <strong className="text-brand-700">{formatCurrency(req.estimated_price)}</strong></span>
                        </div>
                        {req.notes && <div className="text-xs text-gray-400 mt-1">備考: {req.notes}</div>}
                        <div className="text-xs text-gray-400">{formatDateTime(req.submitted_at)}</div>
                      </div>
                      {req.status === "pending" && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleIntakeAction(req.id, "accepted")} disabled={actionId === req.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 disabled:opacity-50">
                            <CheckCircle size={13} /> 受入
                          </button>
                          <button onClick={() => handleIntakeAction(req.id, "rejected")} disabled={actionId === req.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50">
                            <XCircle size={13} /> 却下
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
