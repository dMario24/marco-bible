"use client";

import Link from "next/link";
import { getBook, TOTAL_CHAPTERS } from "@/lib/books";
import { computeStats, useProgress } from "@/lib/progress";

function timeAgo(t: number) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.round(h / 24)}일 전`;
}

export default function Home() {
  const { state, ready } = useProgress();
  const stats = computeStats(state);
  const last = state.last;
  const lastBook = last && getBook(last.code);
  const pct = (stats.all.read / TOTAL_CHAPTERS) * 100;

  return (
    <main className="px-5 pt-safe">
      <header className="pt-8 pb-6">
        <p className="text-sm text-accent font-medium">가톨릭 성경</p>
        <h1 className="text-2xl font-bold mt-1">오늘도 말씀과 함께</h1>
      </header>

      <section aria-label="이어 읽기">
        {ready && lastBook ? (
          <Link
            href={`/read/${last.code}/${last.chapter}${last.verse ? `?v=${last.verse}` : ""}`}
            className="block rounded-2xl bg-accent text-white p-5 active:opacity-90"
          >
            <p className="text-xs opacity-80">이어 읽기 · {timeAgo(last.at)}</p>
            <p className="text-xl font-bold mt-1.5">
              {lastBook.name} {last.chapter}장
            </p>
            <p className="text-sm opacity-90 mt-1">{last.verse ? `${last.verse}번째 절부터` : "처음부터"} 계속 읽기 →</p>
          </Link>
        ) : (
          <Link href="/read/Gn/1" className="block rounded-2xl bg-accent text-white p-5 active:opacity-90">
            <p className="text-xs opacity-80">처음 오셨나요?</p>
            <p className="text-xl font-bold mt-1.5">창세기 1장부터 시작하기</p>
            <p className="text-sm opacity-90 mt-1">또는 목차에서 원하는 곳을 고르세요 →</p>
          </Link>
        )}
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2" aria-label="요약">
        {[
          { label: "오늘", value: stats.today, unit: "장" },
          { label: "연속", value: stats.streak, unit: "일" },
          { label: "이번 주", value: stats.week, unit: "장" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-surface border border-line p-3.5">
            <p className="text-xs text-ink-3">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {s.value}
              <span className="text-sm font-normal text-ink-2 ml-0.5">{s.unit}</span>
            </p>
          </div>
        ))}
      </section>

      <Link href="/stats" className="mt-4 block rounded-xl bg-surface border border-line p-4 active:bg-surface-2">
        <div className="flex items-baseline justify-between">
          <p className="font-medium">성경 전체 진도</p>
          <p className="text-sm text-ink-2 tabular-nums">
            {stats.all.read.toLocaleString()} / {TOTAL_CHAPTERS.toLocaleString()}장
          </p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full rounded-full bg-viz" style={{ width: `${pct}%`, minWidth: stats.all.read ? 4 : 0 }} />
        </div>
        <p className="mt-2 text-xs text-ink-3">
          {pct.toFixed(1)}% · 구약 {stats.ot.read}/{stats.ot.total} · 신약 {stats.nt.read}/{stats.nt.total} · 자세히 →
        </p>
      </Link>

      <section className="mt-6" aria-label="바로가기">
        <h2 className="text-sm font-medium text-ink-2 mb-2">바로가기</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Mt", "마태오 복음서"],
            ["Jn", "요한 복음서"],
            ["Ps", "시편"],
            ["Acts", "사도행전"],
          ].map(([code, name]) => (
            <Link
              key={code}
              href={`/books?b=${code}`}
              className="rounded-xl bg-surface border border-line px-4 py-3 text-sm active:bg-surface-2"
            >
              {name}
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-10 mb-4 text-[11px] text-ink-3 text-center leading-relaxed">
        본문 출처: 한국천주교주교회의 『성경』(bible.cbck.or.kr)
        <br />
        읽기 기록은 이 기기에만 저장됩니다.
      </p>
    </main>
  );
}
