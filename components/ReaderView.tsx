"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adjacentChapter, chapterKey, getBook } from "@/lib/books";
import type { Block } from "@/lib/parse";
import { markRead, savePosition, setFontSize, unmarkRead, useProgress } from "@/lib/progress";

const SOURCE = "https://bible.cbck.or.kr/Knb";
/** 끝까지 스크롤해도 이 시간 이상 머물러야 자동으로 '읽음' 처리 */
const MIN_DWELL_MS = 20_000;

export default function ReaderView({ code, chapter, blocks }: { code: string; chapter: number; blocks: Block[] }) {
  const book = getBook(code)!;
  const router = useRouter();
  const { state } = useProgress();
  const isRead = Boolean(state.read[chapterKey(code, chapter)]);
  const fontSize = state.settings.fontSize;
  const prev = adjacentChapter(code, chapter, -1);
  const next = adjacentChapter(code, chapter, 1);
  const hrefOf = (p: { code: string; chapter: number } | null) => (p ? `/read/${p.code}/${p.chapter}` : null);

  const endRef = useRef<HTMLDivElement>(null);
  const [showChrome, setShowChrome] = useState(true);
  const [justMarked, setJustMarked] = useState(false);

  // 처음 열 때: 이어 읽기 위치로 스크롤 & 위치 저장
  useEffect(() => {
    const v = Number(new URLSearchParams(window.location.search).get("v"));
    if (v > 1) {
      const el = document.getElementById(`v${v}`);
      if (el) {
        el.scrollIntoView({ block: "start" });
        window.scrollBy(0, -72);
        el.classList.add("verse-flash");
      }
    } else {
      window.scrollTo(0, 0);
    }
    savePosition(code, chapter, v > 1 ? v : undefined);
  }, [code, chapter]);

  // 화면 맨 위에 보이는 절을 추적해 이어 읽기 위치로 저장
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const verses = Array.from(document.querySelectorAll<HTMLElement>("[data-verse]"));
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const top = verses.find((el) => el.getBoundingClientRect().bottom > 80);
        if (top) savePosition(code, chapter, Number(top.dataset.verse));
      }, 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [code, chapter]);

  // 장 끝에 도달 + 충분히 머문 경우 자동으로 읽음 처리
  useEffect(() => {
    const openedAt = Date.now();
    let dwellTimer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([entry]) => {
      clearTimeout(dwellTimer);
      if (!entry.isIntersecting) return;
      const wait = Math.max(0, MIN_DWELL_MS - (Date.now() - openedAt));
      dwellTimer = setTimeout(() => {
        markRead(code, chapter);
        setJustMarked(true);
      }, wait);
    });
    if (endRef.current) io.observe(endRef.current);
    return () => {
      clearTimeout(dwellTimer);
      io.disconnect();
    };
  }, [code, chapter]);

  // 스크롤 방향에 따라 상단 바 숨김
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 8) return;
      setShowChrome(y < lastY || y < 60);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 좌우 스와이프로 이전/다음 장
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, t: e.timeStamp };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start || window.getSelection()?.toString()) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (e.timeStamp - start.t > 600 || Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.5) return;
    const target = hrefOf(dx < 0 ? next : prev);
    if (target) router.push(target);
  };

  let verseNo = 0;

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header
        className={`fixed top-0 inset-x-0 z-30 border-b border-line bg-bg/95 backdrop-blur pt-safe transition-transform duration-200 ${showChrome ? "" : "-translate-y-full"}`}
      >
        <div className="max-w-xl mx-auto flex items-center h-14 px-2">
          <Link href="/" className="p-2.5 text-ink-2" aria-label="홈">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <Link href={`/books?b=${code}`} className="flex-1 min-w-0 text-center font-medium truncate">
            {book.name} {chapter}장
            <span className="ml-1 text-ink-3 text-xs align-middle">▾</span>
          </Link>
          <div className="flex items-center">
            <button
              onClick={() => setFontSize(Math.max(14, fontSize - 1))}
              className="p-2.5 text-ink-2 text-sm"
              aria-label="글자 작게"
            >
              가
            </button>
            <button
              onClick={() => setFontSize(Math.min(30, fontSize + 1))}
              className="p-2.5 text-ink-2 text-lg font-medium"
              aria-label="글자 크게"
            >
              가
            </button>
          </div>
        </div>
      </header>

      <article className="px-5 pt-20 pb-8 font-serif" style={{ fontSize, lineHeight: 1.85 }}>
        <h1 className="font-sans text-center text-ink-3 text-sm mb-6 tracking-wide">
          {book.name} <span className="text-ink text-2xl font-bold block mt-1">{chapter}</span>
        </h1>
        {blocks.map((b, i) => {
          if (b.type === "heading") {
            return (
              <h2 key={i} className="font-sans font-bold text-accent mt-8 mb-3" style={{ fontSize: fontSize * 0.82 }}>
                {b.text}
              </h2>
            );
          }
          verseNo++;
          return (
            <p key={i} id={`v${verseNo}`} data-verse={verseNo} className="mb-2.5 scroll-mt-20 rounded">
              <sup className="font-sans text-accent/80 font-medium mr-1.5 select-none" style={{ fontSize: fontSize * 0.6 }}>
                {b.label}
              </sup>
              {b.lines.map((line, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
          );
        })}
        <div ref={endRef} className="h-px" />
      </article>

      <div className="px-5 pb-6 text-center">
        <button
          onClick={() => {
            if (isRead) {
              unmarkRead(code, chapter);
              setJustMarked(false);
            } else {
              markRead(code, chapter);
              setJustMarked(true);
            }
          }}
          className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors ${
            isRead ? "bg-accent-soft text-accent" : "bg-accent text-white"
          }`}
        >
          {isRead ? "✓ 읽었습니다" : "이 장을 읽었습니다"}
        </button>
        {justMarked && isRead && next && (
          <p className="mt-3 text-xs text-ink-3">기록했습니다. 다음 장으로 넘어가 볼까요?</p>
        )}
        <p className="mt-8 text-[11px] text-ink-3 leading-relaxed">
          본문 출처: 한국천주교주교회의 『성경』 ·{" "}
          <a href={`${SOURCE}/${code}/${chapter}`} target="_blank" rel="noreferrer" className="underline">
            원문과 주석 보기
          </a>
        </p>
      </div>

      <nav className="sticky bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur pb-safe">
        <div className="max-w-xl mx-auto grid grid-cols-2 text-sm">
          {[
            { p: prev, label: "이전", align: "justify-start", arrow: "‹" },
            { p: next, label: "다음", align: "justify-end", arrow: "›" },
          ].map(({ p, label, align, arrow }) => {
            const href = hrefOf(p);
            const b = p && getBook(p.code);
            const text = b ? `${b.code === code ? "" : b.short + " "}${p!.chapter}장` : "";
            const inner = (
              <span className={`flex items-center gap-2 px-5 py-3.5 ${align}`}>
                {label === "이전" && <span className="text-xl leading-none">{arrow}</span>}
                <span>
                  <span className="text-ink-3 text-xs mr-1">{label}</span>
                  {text}
                </span>
                {label === "다음" && <span className="text-xl leading-none">{arrow}</span>}
              </span>
            );
            return href ? (
              <Link key={label} href={href} className="text-ink-2 active:bg-surface-2">
                {inner}
              </Link>
            ) : (
              <span key={label} className="text-ink-3/50" />
            );
          })}
        </div>
      </nav>
    </div>
  );
}
