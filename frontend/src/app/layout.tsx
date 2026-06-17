import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GL DX 管理システム",
  description: "GL株式会社 商品一括管理システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
