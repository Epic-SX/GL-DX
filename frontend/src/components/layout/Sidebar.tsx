"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart2,
  Bell,
  Store,
  Settings,
  LogOut,
  Users,
  BookOpen,
  Image,
  FileText,
  Building2,
} from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ダッシュボード" },
  { href: "/inventory", icon: Package, label: "在庫管理" },
  { href: "/orders", icon: ShoppingCart, label: "受注管理" },
  { href: "/shipments", icon: Truck, label: "出荷管理" },
  { href: "/channels", icon: Store, label: "販路連携" },
  { href: "/clients", icon: Users, label: "クライアント" },
  { href: "/analytics", icon: BarChart2, label: "売上分析" },
  { href: "/accounting", icon: BookOpen, label: "経理" },
  { href: "/fc-portal", icon: Building2, label: "FC管理" },
  { href: "/contracts", icon: FileText, label: "契約管理" },
  { href: "/media", icon: Image, label: "メディア" },
  { href: "/alerts", icon: Bell, label: "アラート" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    Cookies.remove("access_token");
    router.push("/login");
  }

  return (
    <aside className="w-60 min-h-screen bg-brand-800 text-white flex flex-col">
      <div className="p-5 border-b border-brand-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <span className="text-brand-800 font-bold text-sm">GL</span>
          </div>
          <div>
            <div className="font-bold text-sm">GL DX System</div>
            <div className="text-xs text-brand-300">管理システム</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sidebar-link",
                active
                  ? "bg-white text-brand-800"
                  : "text-brand-100 hover:bg-brand-700 hover:text-white"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-brand-700 space-y-1">
        <Link
          href="/settings"
          className="sidebar-link text-brand-100 hover:bg-brand-700 hover:text-white"
        >
          <Settings size={18} />
          設定
        </Link>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left text-brand-100 hover:bg-brand-700 hover:text-white"
        >
          <LogOut size={18} />
          ログアウト
        </button>
      </div>
    </aside>
  );
}
