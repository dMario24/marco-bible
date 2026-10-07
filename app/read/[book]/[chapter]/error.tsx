"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-6 pt-24 text-center space-y-4">
      <p className="text-lg font-medium">본문을 불러오지 못했습니다</p>
      <p className="text-sm text-ink-2">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
      <div className="flex justify-center gap-3 pt-2">
        <button onClick={reset} className="rounded-full bg-accent text-white px-5 py-2.5 text-sm">
          다시 시도
        </button>
        <Link href="/books" className="rounded-full border border-line px-5 py-2.5 text-sm">
          목차로
        </Link>
      </div>
    </div>
  );
}
