"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", icon: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/books", label: "목차", icon: "M4 5h16M4 12h16M4 19h10" },
  { href: "/read", label: "이어 읽기", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" },
  { href: "/stats", label: "통계", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
];

export default function BottomNav() {
  const pathname = usePathname();
  // 본문 화면은 자체 하단 바를 사용
  if (pathname.startsWith("/read/")) return null;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-line bg-surface/95 backdrop-blur pb-safe">
      <ul className="max-w-xl mx-auto grid grid-cols-4">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${active ? "text-accent font-medium" : "text-ink-3"}`}
              >
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={t.icon} />
                </svg>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
