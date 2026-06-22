"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { getContracts, createContract, sendContract, signContract } from "@/lib/api";
import { FileText, Send, PenLine, Plus, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface Contract {
  id: number; contract_number: string; fc_store_name: string; owner_name: string;
  contract_type: string; amount: number; status: string;
  created_at: string; sent_at: string | null; signed_at: string | null; expires_at: string | null; notes: string;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  draft:   { label: "下書き",   badge: "bg-gray-100 text-gray-600",    icon: <FileText size={12} /> },
  sent:    { label: "送付済み", badge: "bg-blue-100 text-blue-700",    icon: <Clock size={12} /> },
  signed:  { label: "署名済み", badge: "bg-green-100 text-green-700",  icon: <CheckCircle size={12} /> },
  expired: { label: "期限切れ", badge: "bg-red-100 text-red-500",      icon: <AlertTriangle size={12} /> },
};

const CONTRACT_TEMPLATE = `
【FC加盟契約書】

本契約は、GL株式会社（以下「甲」）と加盟店（以下「乙」）との間で締結されます。

第1条（目的）
甲は乙に対し、GLDXシステムの利用権及び本部サポートを提供し、乙はこれを受けてFC店として運営を行うものとします。

第2条（加盟金）
乙は甲に対し、加盟金として500,000円（税別）を契約締結後14日以内に支払うものとします。

第3条（ロイヤルティ）
乙は毎月の売上に対し、甲所定のロイヤルティを支払うものとします。

第4条（契約期間）
本契約の有効期間は、契約締結日より1年間とします。

第5条（禁止事項）
乙は甲の事前承諾なく、第三者に本システムの利用権を譲渡・転貸してはなりません。

以上、本契約の成立を証するため、本書2通を作成し、各自1通を保有するものとします。
`.trim();

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [form, setForm] = useState({ fc_store_name: "", owner_name: "", amount: "500000", notes: "" });

  useEffect(() => {
    getContracts().then((r) => setContracts(r.data));
  }, []);

  const filtered = statusFilter ? contracts.filter((c) => c.status === statusFilter) : contracts;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const r = await createContract({ ...form, amount: Number(form.amount), contract_type: "FC加盟契約" });
    setContracts((prev) => [r.data, ...prev]);
    setShowCreate(false);
    setForm({ fc_store_name: "", owner_name: "", amount: "500000", notes: "" });
  }

  async function handleSend(id: number) {
    if (!confirm("この契約書を送付しますか？")) return;
    setActionId(id);
    try {
      const r = await sendContract(id);
      setContracts((prev) => prev.map((c) => c.id === id ? { ...c, ...r.data } : c));
      if (selectedContract?.id === id) setSelectedContract({ ...selectedContract, ...r.data });
    } finally { setActionId(null); }
  }

  async function handleSign(id: number) {
    if (!confirm("署名済みとしてマークしますか？\n※ 本番環境ではCloudSign等の電子署名サービスを使用します。")) return;
    setActionId(id);
    try {
      const r = await signContract(id);
      setContracts((prev) => prev.map((c) => c.id === id ? { ...c, ...r.data } : c));
      if (selectedContract?.id === id) setSelectedContract({ ...selectedContract, ...r.data });
    } finally { setActionId(null); }
  }

  const counts = { all: contracts.length, draft: 0, sent: 0, signed: 0, expired: 0 };
  contracts.forEach((c) => { if (counts[c.status as keyof typeof counts] !== undefined) counts[c.status as keyof typeof counts]++; });

  return (
    <div className="flex flex-col flex-1">
      <Header title="契約管理" />
      <div className="p-6 space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          <strong>⚠️ 本番環境での電子署名について:</strong> 法的効力のある電子署名には
          <strong> CloudSign（クラウドサイン）</strong> または <strong>DocuSign</strong> 等のAPI連携が必要です。
          現在はデモモードで動作しています。
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[["", "全て"], ["draft", "下書き"], ["sent", "送付済み"], ["signed", "署名済み"]].map(([v, l]) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === v ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {l} {v === "" ? `(${counts.all})` : `(${counts[v as keyof typeof counts]})`}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)} className="ml-auto btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> 新規契約作成
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Contract List */}
          <div className="col-span-2 card">
            <div className="divide-y divide-gray-100">
              {filtered.map((c) => {
                const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
                return (
                  <div key={c.id} onClick={() => setSelectedContract(c)}
                    className={`py-4 px-2 cursor-pointer rounded-lg transition-colors hover:bg-gray-50 ${selectedContract?.id === c.id ? "bg-brand-50" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">{c.fc_store_name}</span>
                          <span className={`badge flex items-center gap-1 ${cfg.badge}`}>{cfg.icon}{cfg.label}</span>
                        </div>
                        <div className="text-sm text-gray-500">{c.owner_name} / {c.contract_type}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          <span className="mr-3">契約番号: {c.contract_number}</span>
                          <span>作成日: {c.created_at}</span>
                          {c.signed_at && <span className="ml-3 text-green-600">署名日: {c.signed_at.slice(0, 10)}</span>}
                          {c.expires_at && <span className="ml-3">有効期限: {c.expires_at}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-brand-700">¥{Number(c.amount).toLocaleString()}</div>
                        {c.status === "draft" && (
                          <button onClick={(e) => { e.stopPropagation(); handleSend(c.id); }} disabled={actionId === c.id}
                            className="mt-1 flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 disabled:opacity-50">
                            <Send size={11} /> 送付
                          </button>
                        )}
                        {c.status === "sent" && (
                          <button onClick={(e) => { e.stopPropagation(); handleSign(c.id); }} disabled={actionId === c.id}
                            className="mt-1 flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 disabled:opacity-50">
                            <PenLine size={11} /> 署名済みに
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">契約なし</div>}
            </div>
          </div>

          {/* Contract Preview */}
          <div className="card">
            {selectedContract ? (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-brand-600" />
                  契約書プレビュー
                </h3>
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <div>契約番号: <strong>{selectedContract.contract_number}</strong></div>
                  <div>FC店: <strong>{selectedContract.fc_store_name}</strong></div>
                  <div>オーナー: {selectedContract.owner_name}</div>
                  <div>加盟金: <strong className="text-brand-700">¥{Number(selectedContract.amount).toLocaleString()}</strong></div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto border border-gray-200">
                  {CONTRACT_TEMPLATE.replace("500,000", Number(selectedContract.amount).toLocaleString())}
                </div>
                <button onClick={() => window.print()} className="mt-3 w-full btn-secondary text-xs">
                  印刷 / PDF保存
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <FileText size={32} className="mb-2 text-gray-300" />
                <span className="text-sm">契約を選択してください</span>
              </div>
            )}
          </div>
        </div>

        {/* Create Contract Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">新規契約作成</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <Field label="FC店舗名 *">
                  <input required value={form.fc_store_name} onChange={(e) => setForm({ ...form, fc_store_name: e.target.value })}
                    className="input w-full" placeholder="〇〇店" />
                </Field>
                <Field label="オーナー名 *">
                  <input required value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                    className="input w-full" placeholder="氏名" />
                </Field>
                <Field label="加盟金 (¥)">
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input w-full" min="0" />
                </Field>
                <Field label="備考">
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="input w-full resize-none" rows={2} />
                </Field>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1">作成</button>
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">キャンセル</button>
                </div>
              </form>
            </div>
          </div>
        )}
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
