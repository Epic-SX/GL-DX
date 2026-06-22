"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import {
  getClients, getAccountingEntries, createAccountingEntry, updateAccountingEntry,
  deleteAccountingEntry, getBankAccounts, createBankAccount, deleteBankAccount,
} from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Client } from "@/types";
import { Plus, Landmark, Receipt, CheckCircle2, Clock, XCircle, Pencil, Trash2, Building2 } from "lucide-react";

interface BankAccount {
  id: number; bank_name: string; branch_name: string;
  account_type: string; account_number: string; account_holder: string; is_default: boolean; notes?: string;
}

interface Entry {
  id: number; voucher_number: string; entry_date: string;
  client_id?: number; client_name?: string;
  bank_account_id?: number; bank_account_name?: string;
  description: string; amount: number; transfer_status: string;
  notes?: string; created_at: string;
}

const STATUS_LABELS: Record<string, string> = { pending: "未払", paid: "支払済", cancelled: "取消" };
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={13} />,
  paid: <CheckCircle2 size={13} />,
  cancelled: <XCircle size={13} />,
};

export default function AccountingPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"entries" | "banks">("entries");

  // Entry form state
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryForm, setEntryForm] = useState({ entry_date: "", client_id: "", bank_account_id: "", description: "", amount: "", notes: "" });
  const [entryLoading, setEntryLoading] = useState(false);

  // Bank form state
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({ bank_name: "", branch_name: "", account_type: "ordinary", account_number: "", account_holder: "", is_default: false, notes: "" });
  const [bankLoading, setBankLoading] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");

  function fetchAll() {
    setLoading(true);
    Promise.all([
      getAccountingEntries({ transfer_status: filterStatus || undefined, per_page: 100 }),
      getBankAccounts(),
      getClients(),
    ]).then(([e, b, c]) => {
      setEntries(e.data);
      setBanks(b.data);
      setClients(c.data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { fetchAll(); }, [filterStatus]);

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault();
    setEntryLoading(true);
    try {
      await createAccountingEntry({
        entry_date: entryForm.entry_date,
        client_id: entryForm.client_id ? Number(entryForm.client_id) : undefined,
        bank_account_id: entryForm.bank_account_id ? Number(entryForm.bank_account_id) : undefined,
        description: entryForm.description,
        amount: Number(entryForm.amount),
        notes: entryForm.notes || undefined,
      });
      setShowEntryForm(false);
      setEntryForm({ entry_date: "", client_id: "", bank_account_id: "", description: "", amount: "", notes: "" });
      fetchAll();
    } finally { setEntryLoading(false); }
  }

  async function handleStatusChange(id: number, status: string) {
    await updateAccountingEntry(id, { transfer_status: status });
    fetchAll();
  }

  async function handleDeleteEntry(id: number, voucher: string) {
    if (!confirm(`伝票「${voucher}」を削除しますか？`)) return;
    await deleteAccountingEntry(id);
    fetchAll();
  }

  async function handleCreateBank(e: React.FormEvent) {
    e.preventDefault();
    setBankLoading(true);
    try {
      await createBankAccount({ ...bankForm, is_default: Boolean(bankForm.is_default) });
      setShowBankForm(false);
      setBankForm({ bank_name: "", branch_name: "", account_type: "ordinary", account_number: "", account_holder: "", is_default: false, notes: "" });
      fetchAll();
    } finally { setBankLoading(false); }
  }

  async function handleDeleteBank(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await deleteBankAccount(id);
    fetchAll();
  }

  const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
  const paidAmount = entries.filter((e) => e.transfer_status === "paid").reduce((s, e) => s + e.amount, 0);
  const pendingAmount = entries.filter((e) => e.transfer_status === "pending").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="flex flex-col flex-1">
      <Header title="経理" />
      <div className="p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">合計金額</div>
            <div className="text-2xl font-bold text-gray-800">{formatCurrency(totalAmount)}</div>
            <div className="text-xs text-gray-400 mt-1">{entries.length}件</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" />支払済</div>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(paidAmount)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock size={12} className="text-yellow-500" />未払</div>
            <div className="text-2xl font-bold text-yellow-700">{formatCurrency(pendingAmount)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {(["entries", "banks"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {t === "entries" ? (
                <span className="flex items-center gap-1.5"><Receipt size={15} />伝票一覧</span>
              ) : (
                <span className="flex items-center gap-1.5"><Building2 size={15} />振込先銀行</span>
              )}
            </button>
          ))}
        </div>

        {tab === "entries" && (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">全ステータス</option>
                <option value="pending">未払</option>
                <option value="paid">支払済</option>
                <option value="cancelled">取消</option>
              </select>
              <button onClick={() => setShowEntryForm(true)} className="btn-primary flex items-center gap-2 ml-auto">
                <Plus size={16} />伝票登録
              </button>
            </div>

            {/* Entry form */}
            {showEntryForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-4">新規伝票登録</h3>
                <form onSubmit={handleCreateEntry} className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">日付 *</label>
                    <input type="date" required value={entryForm.entry_date}
                      onChange={(e) => setEntryForm((f) => ({ ...f, entry_date: e.target.value }))} className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">取引先</label>
                    <select value={entryForm.client_id}
                      onChange={(e) => setEntryForm((f) => ({ ...f, client_id: e.target.value }))} className="input w-full">
                      <option value="">選択してください</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">摘要 *</label>
                    <input required value={entryForm.description}
                      onChange={(e) => setEntryForm((f) => ({ ...f, description: e.target.value }))}
                      className="input w-full" placeholder="取引内容を入力" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">金額 (¥) *</label>
                    <input type="number" required min="0" value={entryForm.amount}
                      onChange={(e) => setEntryForm((f) => ({ ...f, amount: e.target.value }))} className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">振込先銀行</label>
                    <select value={entryForm.bank_account_id}
                      onChange={(e) => setEntryForm((f) => ({ ...f, bank_account_id: e.target.value }))} className="input w-full">
                      <option value="">選択してください</option>
                      {banks.map((b) => <option key={b.id} value={b.id}>{b.bank_name} {b.branch_name} {b.account_number}{b.is_default ? " ★" : ""}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                    <input value={entryForm.notes}
                      onChange={(e) => setEntryForm((f) => ({ ...f, notes: e.target.value }))} className="input w-full" />
                  </div>
                  <div className="col-span-2 flex gap-3">
                    <button type="submit" className="btn-primary" disabled={entryLoading}>
                      {entryLoading ? "登録中..." : "登録する"}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setShowEntryForm(false)}>キャンセル</button>
                  </div>
                </form>
              </div>
            )}

            {/* Entries table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">伝票番号</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">日付</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">取引先</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">摘要</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">金額</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">振込先</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">読み込み中...</td></tr>
                  ) : entries.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">伝票がありません</td></tr>
                  ) : entries.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-brand-600">{e.voucher_number}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{e.entry_date}</td>
                      <td className="px-4 py-3 text-gray-700">{e.client_name || "-"}</td>
                      <td className="px-4 py-3 text-gray-800 max-w-48 truncate">{e.description}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(e.amount)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{e.bank_account_name || "-"}</td>
                      <td className="px-4 py-3">
                        <select value={e.transfer_status}
                          onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[e.transfer_status] || ""}`}>
                          <option value="pending">未払</option>
                          <option value="paid">支払済</option>
                          <option value="cancelled">取消</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <button onClick={() => handleDeleteEntry(e.id, e.voucher_number)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "banks" && (
          <>
            <div className="flex justify-end">
              <button onClick={() => setShowBankForm(true)} className="btn-primary flex items-center gap-2">
                <Plus size={16} />銀行口座登録
              </button>
            </div>

            {showBankForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-4">振込先銀行口座登録</h3>
                <form onSubmit={handleCreateBank} className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">銀行名 *</label>
                    <input required value={bankForm.bank_name}
                      onChange={(e) => setBankForm((f) => ({ ...f, bank_name: e.target.value }))} className="input w-full" placeholder="○○銀行" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">支店名 *</label>
                    <input required value={bankForm.branch_name}
                      onChange={(e) => setBankForm((f) => ({ ...f, branch_name: e.target.value }))} className="input w-full" placeholder="○○支店" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">口座種別</label>
                    <select value={bankForm.account_type}
                      onChange={(e) => setBankForm((f) => ({ ...f, account_type: e.target.value }))} className="input w-full">
                      <option value="ordinary">普通</option>
                      <option value="checking">当座</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">口座番号 *</label>
                    <input required value={bankForm.account_number}
                      onChange={(e) => setBankForm((f) => ({ ...f, account_number: e.target.value }))} className="input w-full" placeholder="1234567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">口座名義 *</label>
                    <input required value={bankForm.account_holder}
                      onChange={(e) => setBankForm((f) => ({ ...f, account_holder: e.target.value }))} className="input w-full" placeholder="カ）グローイングロジック" />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input type="checkbox" id="is_default" checked={bankForm.is_default}
                      onChange={(e) => setBankForm((f) => ({ ...f, is_default: e.target.checked }))} />
                    <label htmlFor="is_default" className="text-sm text-gray-700">デフォルト口座に設定</label>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                    <input value={bankForm.notes}
                      onChange={(e) => setBankForm((f) => ({ ...f, notes: e.target.value }))} className="input w-full" />
                  </div>
                  <div className="col-span-2 flex gap-3">
                    <button type="submit" className="btn-primary" disabled={bankLoading}>{bankLoading ? "登録中..." : "登録する"}</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowBankForm(false)}>キャンセル</button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {banks.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
                  <Landmark size={32} className="mx-auto text-gray-300 mb-2" />
                  <p>銀行口座が登録されていません</p>
                </div>
              ) : banks.map((b) => (
                <div key={b.id} className={`bg-white border rounded-xl p-5 ${b.is_default ? "border-brand-400" : "border-gray-200"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-800 flex items-center gap-2">
                        <Landmark size={16} className="text-brand-600" />
                        {b.bank_name} {b.branch_name}
                        {b.is_default && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">デフォルト</span>}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {b.account_type === "ordinary" ? "普通" : "当座"} {b.account_number}
                      </div>
                      <div className="text-sm text-gray-500">{b.account_holder}</div>
                      {b.notes && <div className="text-xs text-gray-400 mt-1">{b.notes}</div>}
                    </div>
                    <button onClick={() => handleDeleteBank(b.id, b.bank_name)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
