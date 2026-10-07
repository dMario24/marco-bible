import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const sans = Noto_Sans_KR({
  variable: "--font-sans-kr",
  weight: ["400", "500", "700"],
  preload: false,
});

const serif = Noto_Serif_KR({
  variable: "--font-serif-kr",
  weight: ["400", "600"],
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "가톨릭 성경", template: "%s · 가톨릭 성경" },
  description: "모바일에서 편하게 읽는 가톨릭 성경 — 이어 읽기와 읽기 통계",
  appleWebApp: { capable: true, title: "가톨릭 성경", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#141312" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="flex-1 w-full max-w-xl mx-auto pb-20">{children}</div>
        <Suspense>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
