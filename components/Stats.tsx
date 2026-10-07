"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { TOTAL_CHAPTERS } from "@/lib/books";
import { computeStats, dayKey, exportData, importData, resetAll, useProgress } from "@/lib/progress";

const WEEKS = 18;
const DAY = 86400000;
const LEVEL_BG = ["var(--viz-0)", "var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)", "var(--viz-5)"];

function level(n: number) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n === 2) return 2;
  if (n <= 4) return 3;
  if (n <= 9) return 4;
  return 5;
}

function fmtDate(t: number) {
  const d = new Date(t);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${"일월화수목금토"[d.getDay()]})`;
}

function Bar({ value, total, label }: { value: number; total: number; label: string }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-ink-2 tabular-nums">
          {value}/{total}장 · {pct.toFixed(1)}%
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full bg-viz" style={{ width: `${pct}%`, minWidth: value ? 4 : 0 }} />
      </div>
    </div>
  );
}

export default function Stats() {
  const { state } = useProgress();
  const s = computeStats(state);
  const [picked, setPicked] = useState<{ t: number; n: number } | null>(null);
  const [pickedBar, setPickedBar] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 히트맵: 오늘이 포함된 주(월요일 시작)를 마지막 열로
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastMonday = today.getTime() - ((today.getDay() + 6) % 7) * DAY;
  const firstDay = lastMonday - (WEEKS - 1) * 7 * DAY;
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const t = firstDay + (w * 7 + d) * DAY;
      return { t, n: s.perDay.get(dayKey(t)) ?? 0, future: t > today.getTime() };
    }),
  );

  // 최근 14일 막대
  const recent = Array.from({ length: 14 }, (_, i) => {
    const t = today.getTime() - (13 - i) * DAY;
    return { t, n: s.perDay.get(dayKey(t)) ?? 0 };
  });
  const maxRecent = Math.max(1, ...recent.map((r) => r.n));
  const recentTotal = recent.reduce((a, r) => a + r.n, 0);

  const bookRows = showAll ? s.books : s.books.filter((b) => b.read > 0);
  const pct = (s.all.read / TOTAL_CHAPTERS) * 100;

  return (
    <main className="px-5 pt-safe pb-6">
      <h1 className="pt-6 pb-4 text-xl font-bold">읽기 통계</h1>

      {/* 전체 진도 */}
      <section className="rounded-2xl bg-surface border border-line p-5">
        <p className="text-sm text-ink-2">성경 전체 진도</p>
        <p className="mt-1 text-4xl font-bold tabular-nums">
          {pct.toFixed(1)}
          <span className="text-lg font-medium text-ink-2">%</span>
        </p>
        <p className="text-sm text-ink-3 tabular-nums">
          {s.all.read.toLocaleString()} / {TOTAL_CHAPTERS.toLocaleString()}장 · 남은 장 {(TOTAL_CHAPTERS - s.all.read).toLocaleString()}
        </p>
        <div className="mt-5 space-y-4">
          <Bar label="구약" value={s.ot.read} total={s.ot.total} />
          <Bar label="신약" value={s.nt.read} total={s.nt.total} />
        </div>
      </section>

      {/* 요약 타일 */}
      <section className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["연속 읽기", s.streak, "일"],
          ["최장 연속", s.longest, "일"],
          ["읽은 날", s.activeDays, "일"],
          ["이번 달", s.month, "장"],
          ["완독한 책", s.completedBooks, "권"],
          ["누적 읽기", s.totalReads, "장"],
        ].map(([label, value, unit]) => (
          <div key={label} className="rounded-xl bg-surface border border-line p-3">
            <p className="text-[11px] text-ink-3">{label}</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums">
              {value}
              <span className="text-xs font-normal text-ink-2 ml-0.5">{unit}</span>
            </p>
          </div>
        ))}
      </section>

      {/* 히트맵 */}
      <section className="mt-3 rounded-2xl bg-surface border border-line p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">읽기 달력</h2>
          <p className="text-xs text-ink-3">최근 {WEEKS}주</p>
        </div>
        <div className="mt-3 flex gap-1.5">
          <div className="grid grid-rows-7 gap-[3px] text-[9px] text-ink-3 pr-0.5" aria-hidden>
            {"월화수목금토일".split("").map((d, i) => (
              <span key={d} className="leading-none flex items-center h-full">
                {i % 2 === 0 ? d : ""}
              </span>
            ))}
          </div>
          <div className="flex-1 grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }} role="grid" aria-label="일별 읽은 장 수">
            {weeks.map((week, w) => (
              <div key={w} className="grid grid-rows-7 gap-[3px]">
                {week.map(({ t, n, future }) =>
                  future ? (
                    <span key={t} className="aspect-square" />
                  ) : (
                    <button
                      key={t}
                      onClick={() => setPicked({ t, n })}
                      className={`aspect-square rounded-[3px] ${picked?.t === t ? "ring-2 ring-ink" : ""}`}
                      style={{ background: LEVEL_BG[level(n)] }}
                      aria-label={`${fmtDate(t)} ${n}장`}
                      title={`${fmtDate(t)} · ${n}장`}
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-ink-3">
          <span className="text-ink-2 min-h-4">{picked ? `${fmtDate(picked.t)} · ${picked.n}장` : "칸을 누르면 날짜별 기록이 보입니다"}</span>
          <span className="flex items-center gap-[3px]">
            적음
            {LEVEL_BG.map((bg) => (
              <span key={bg} className="size-2.5 rounded-[2px]" style={{ background: bg }} />
            ))}
            많음
          </span>
        </div>
      </section>

      {/* 최근 14일 */}
      <section className="mt-3 rounded-2xl bg-surface border border-line p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">최근 14일</h2>
          <p className="text-xs text-ink-3">총 {recentTotal}장 · 하루 평균 {(recentTotal / 14).toFixed(1)}장</p>
        </div>
        <div className="mt-4 h-28 flex items-end gap-[2px] border-b border-line" role="list">
          {recent.map((r, i) => (
            <button
              key={r.t}
              role="listitem"
              onClick={() => setPickedBar(i)}
              className="flex-1 h-full flex items-end group"
              aria-label={`${fmtDate(r.t)} ${r.n}장`}
              title={`${fmtDate(r.t)} · ${r.n}장`}
            >
              <span
                className={`w-full rounded-t-[4px] bg-viz ${pickedBar === i ? "opacity-100" : "opacity-85 group-hover:opacity-100"}`}
                style={{ height: r.n ? `${(r.n / maxRecent) * 100}%` : 0 }}
              />
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-ink-3">
          <span>{new Date(recent[0].t).getMonth() + 1}/{new Date(recent[0].t).getDate()}</span>
          <span className="text-ink-2">
            {pickedBar !== null ? `${fmtDate(recent[pickedBar].t)} · ${recent[pickedBar].n}장` : ""}
          </span>
          <span>오늘</span>
        </div>
      </section>

      {/* 책별 진도 */}
      <section className="mt-3 rounded-2xl bg-surface border border-line p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">책별 진도</h2>
          <button onClick={() => setShowAll((v) => !v)} className="text-xs text-accent">
            {showAll ? "읽은 책만" : "전체 보기"}
          </button>
        </div>
        {bookRows.length === 0 ? (
          <p className="mt-4 text-sm text-ink-3">
            아직 읽은 장이 없습니다.{" "}
            <Link href="/read" className="text-accent underline">
              읽기 시작하기
            </Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {bookRows.map(({ book, read }) => (
              <li key={book.code}>
                <Link href={`/books?b=${book.code}`} className="block">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">
                      {book.name}
                      {read === book.chapters && <span className="ml-1.5 text-xs text-accent">완독</span>}
                    </span>
                    <span className="text-ink-3 tabular-nums shrink-0 ml-2">
                      {read}/{book.chapters}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full bg-viz" style={{ width: `${(read / book.chapters) * 100}%` }} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 백업 */}
      <section className="mt-3 rounded-2xl bg-surface border border-line p-4">
        <h2 className="font-medium">기록 관리</h2>
        <p className="mt-1 text-xs text-ink-3">읽기 기록은 이 기기의 브라우저에만 저장됩니다. 기기를 바꿀 때는 백업 파일로 옮기세요.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <button
            className="rounded-full border border-line px-4 py-2"
            onClick={() => {
              const url = URL.createObjectURL(new Blob([exportData()], { type: "application/json" }));
              const a = Object.assign(document.createElement("a"), { href: url, download: `bible-progress-${dayKey(Date.now())}.json` });
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            백업 내보내기
          </button>
          <button className="rounded-full border border-line px-4 py-2" onClick={() => fileRef.current?.click()}>
            백업 불러오기
          </button>
          <button
            className="rounded-full border border-line px-4 py-2 text-accent"
            onClick={() => confirm("모든 읽기 기록을 지울까요? 되돌릴 수 없습니다.") && resetAll()}
          >
            초기화
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                importData(await f.text());
                alert("기록을 불러왔습니다.");
              } catch (err) {
                alert((err as Error).message);
              }
            }}
          />
        </div>
      </section>
    </main>
  );
}
