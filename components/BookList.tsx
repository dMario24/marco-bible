"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BOOKS, chapterKey, getBook, type Testament } from "@/lib/books";
import { useProgress } from "@/lib/progress";

export default function BookList() {
  const { state } = useProgress();
  // /books?b=Gn 으로 들어오면 해당 책을 펼쳐서 보여줌
  const initial = getBook(useSearchParams().get("b") ?? "");
  const [tab, setTab] = useState<Testament>(initial?.testament ?? "OT");
  const [open, setOpen] = useState<string | null>(initial?.code ?? null);

  useEffect(() => {
    if (initial) document.getElementById(`book-${initial.code}`)?.scrollIntoView({ block: "start" });
    // 처음 진입했을 때만 스크롤
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const books = BOOKS.filter((b) => b.testament === tab);

  return (
    <main>
      <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur pt-safe border-b border-line">
        <h1 className="px-5 pt-4 pb-3 text-xl font-bold">목차</h1>
        <div className="grid grid-cols-2 gap-1 p-1 mx-5 mb-3 rounded-xl bg-surface-2" role="tablist">
          {(["OT", "NT"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setOpen(null);
              }}
              className={`rounded-lg py-2 text-sm font-medium ${tab === t ? "bg-surface shadow-sm text-ink" : "text-ink-3"}`}
            >
              {t === "OT" ? "구약" : "신약"}
            </button>
          ))}
        </div>
      </header>

      <ul className="divide-y divide-line">
        {books.map((b) => {
          let read = 0;
          for (let c = 1; c <= b.chapters; c++) if (state.read[chapterKey(b.code, c)]) read++;
          const expanded = open === b.code;
          return (
            <li key={b.code} id={`book-${b.code}`} className="scroll-mt-32">
              <button
                onClick={() => setOpen(expanded ? null : b.code)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left active:bg-surface-2"
                aria-expanded={expanded}
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-medium truncate">{b.name}</span>
                  <span className="block text-xs text-ink-3 mt-0.5">
                    {b.chapters}장{read > 0 && ` · ${read}장 읽음`}
                  </span>
                </span>
                <span className="w-16 h-1.5 rounded-full bg-surface-2 overflow-hidden" aria-hidden>
                  <span className="block h-full rounded-full bg-viz" style={{ width: `${(read / b.chapters) * 100}%` }} />
                </span>
                <span className={`text-ink-3 transition-transform ${expanded ? "rotate-90" : ""}`}>›</span>
              </button>
              {expanded && (
                <div className="grid grid-cols-6 gap-2 px-5 pb-4">
                  {Array.from({ length: b.chapters }, (_, i) => i + 1).map((c) => {
                    const isRead = Boolean(state.read[chapterKey(b.code, c)]);
                    const isLast = state.last?.code === b.code && state.last.chapter === c;
                    return (
                      <Link
                        key={c}
                        href={`/read/${b.code}/${c}`}
                        className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                          isRead ? "bg-accent-soft text-accent font-medium" : "bg-surface border border-line text-ink-2"
                        } ${isLast ? "ring-2 ring-accent" : ""}`}
                        aria-label={`${b.name} ${c}장${isRead ? " (읽음)" : ""}`}
                      >
                        {c}
                      </Link>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
