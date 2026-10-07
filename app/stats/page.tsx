import ClientOnly from "@/components/ClientOnly";
import type { Metadata } from "next";
import Stats from "@/components/Stats";

export const metadata: Metadata = { title: "읽기 통계" };

export default function StatsPage() {
  return (
    <ClientOnly fallback={<div className="px-5 pt-24 text-center text-sm text-ink-3">불러오는 중…</div>}>
      <Stats />
    </ClientOnly>
  );
}
