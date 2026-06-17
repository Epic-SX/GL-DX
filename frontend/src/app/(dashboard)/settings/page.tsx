"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { getMe, api } from "@/lib/api";
import { Settings, User, Key, Globe, Bell, Info } from "lucide-react";

interface Profile {
  id: number;
  email: string;
  name: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  gl: "GL管理者",
  fc_owner: "FCオーナー",
  staff: "スタッフ",
  viewer: "閲覧者",
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    getMe().then((r) => {
      setProfile(r.data);
      setName(r.data.name);
    });
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);
    try {
      await api.patch("/auth/me", { name });
      setProfile((p) => (p ? { ...p, name } : p));
      setProfileMsg({ type: "ok", text: "プロフィールを更新しました" });
    } catch {
      setProfileMsg({ type: "err", text: "更新に失敗しました" });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "err", text: "新しいパスワードが一致しません" });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: "err", text: "パスワードは8文字以上で入力してください" });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwMsg({ type: "ok", text: "パスワードを変更しました" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "パスワード変更に失敗しました";
      setPwMsg({ type: "err", text: msg });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="設定" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Profile */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-5">
              <User size={18} className="text-brand-600" />
              プロフィール
            </h2>
            {profile && (
              <div className="mb-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{profile.name}</div>
                  <div className="text-sm text-gray-500">{profile.email}</div>
                  <span className="inline-block mt-1 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[profile.role] ?? profile.role}
                  </span>
                </div>
              </div>
            )}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
                <input
                  className="input w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              {profileMsg && (
                <p className={`text-sm ${profileMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
                  {profileMsg.text}
                </p>
              )}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "保存中..." : "保存する"}
              </button>
            </form>
          </section>

          {/* Password */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-5">
              <Key size={18} className="text-brand-600" />
              パスワード変更
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">現在のパスワード</label>
                <input
                  type="password"
                  className="input w-full"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
                <input
                  type="password"
                  className="input w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード（確認）</label>
                <input
                  type="password"
                  className="input w-full"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {pwMsg && (
                <p className={`text-sm ${pwMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
                  {pwMsg.text}
                </p>
              )}
              <button type="submit" className="btn-primary" disabled={pwSaving}>
                {pwSaving ? "変更中..." : "パスワードを変更する"}
              </button>
            </form>
          </section>

          {/* System Info */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <Info size={18} className="text-brand-600" />
              システム情報
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-500">システム名</dt>
                <dd className="font-medium">GL DX Management System</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-500">バージョン</dt>
                <dd className="font-medium">v1.0.0</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-500 flex items-center gap-1"><Globe size={13} />eBay連携</dt>
                <dd className="text-yellow-600 font-medium">設定が必要（/api/v1/ebay/auth/url）</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-500 flex items-center gap-1"><Bell size={13} />DeepL翻訳</dt>
                <dd className="text-yellow-600 font-medium">APIキー未設定</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-gray-500">サポート</dt>
                <dd className="font-medium">admin@growlog.jp</dd>
              </div>
            </dl>
          </section>

        </div>
      </main>
    </div>
  );
}
