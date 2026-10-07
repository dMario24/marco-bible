"use client";

import { useSyncExternalStore } from "react";
import { BOOKS, chapterKey } from "./books";

export type Position = { code: string; chapter: number; verse?: number; at: number };

export type ReadEvent = { key: string; at: number };

export type ProgressState = {
  /** 장별 읽음 기록: 처음 읽은 시각, 읽은 횟수 */
  read: Record<string, { first: number; last: number; count: number }>;
  /** 읽음 이벤트 로그 (통계용) */
  log: ReadEvent[];
  /** 이어 읽기 위치 */
  last: Position | null;
  settings: { fontSize: number };
};

const STORAGE_KEY = "marco-bible:v1";
const EMPTY: ProgressState = { read: {}, log: [], last: null, settings: { fontSize: 19 } };

let state: ProgressState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      state = { ...EMPTY, ...parsed, settings: { ...EMPTY.settings, ...parsed.settings } };
    }
  } catch {
    // 저장소를 쓸 수 없는 환경(사파리 개인정보 보호 모드 등)에서는 메모리에만 보관
  }
}

function set(next: ProgressState) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return state;
}

export function useProgress() {
  const s = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  // 서버 렌더와 첫 하이드레이션에는 EMPTY가 쓰이므로, 저장된 값이 반영됐는지 표시
  return { state: s, ready: s !== EMPTY || loaded };
}

export function savePosition(code: string, chapter: number, verse?: number) {
  load();
  const prev = state.last;
  if (prev && prev.code === code && prev.chapter === chapter && prev.verse === verse) return;
  set({ ...state, last: { code, chapter, verse, at: Date.now() } });
}

export function markRead(code: string, chapter: number) {
  load();
  const key = chapterKey(code, chapter);
  const now = Date.now();
  const prev = state.read[key];
  // 같은 장을 짧은 시간에 반복 기록하지 않도록 (예: 끝까지 스크롤 후 버튼 다시 누름)
  if (prev && now - prev.last < 10 * 60 * 1000) return;
  set({
    ...state,
    read: {
      ...state.read,
      [key]: { first: prev?.first ?? now, last: now, count: (prev?.count ?? 0) + 1 },
    },
    log: [...state.log, { key, at: now }],
  });
}

export function unmarkRead(code: string, chapter: number) {
  load();
  const key = chapterKey(code, chapter);
  const read = { ...state.read };
  delete read[key];
  set({ ...state, read, log: state.log.filter((e) => e.key !== key) });
}

export function setFontSize(fontSize: number) {
  load();
  set({ ...state, settings: { ...state.settings, fontSize } });
}

export function exportData() {
  load();
  return JSON.stringify(state, null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json) as ProgressState;
  if (!parsed || typeof parsed.read !== "object" || !Array.isArray(parsed.log)) {
    throw new Error("올바른 백업 파일이 아닙니다");
  }
  set({ ...EMPTY, ...parsed, settings: { ...EMPTY.settings, ...parsed.settings } });
}

export function resetAll() {
  set({ ...EMPTY, settings: state.settings });
}

/* ---------- 통계 ---------- */

export function dayKey(t: number | Date) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function computeStats(s: ProgressState, now = Date.now()) {
  const readKeys = new Set(Object.keys(s.read));
  const perDay = new Map<string, number>();
  for (const e of s.log) perDay.set(dayKey(e.at), (perDay.get(dayKey(e.at)) ?? 0) + 1);

  const books = BOOKS.map((b) => {
    let n = 0;
    for (let c = 1; c <= b.chapters; c++) if (readKeys.has(chapterKey(b.code, c))) n++;
    return { book: b, read: n };
  });
  const sum = (t: "OT" | "NT" | null) =>
    books
      .filter((x) => !t || x.book.testament === t)
      .reduce((a, x) => ({ read: a.read + x.read, total: a.total + x.book.chapters }), { read: 0, total: 0 });

  // 연속 읽기: 오늘 아직 안 읽었으면 어제부터 셈
  const oneDay = 86400000;
  let streak = 0;
  let cursor = perDay.has(dayKey(now)) ? now : now - oneDay;
  while (perDay.has(dayKey(cursor))) {
    streak++;
    cursor -= oneDay;
  }

  let longest = 0;
  const days = [...perDay.keys()].sort();
  let run = 0;
  let prev: number | null = null;
  for (const d of days) {
    const t = new Date(d + "T00:00:00").getTime();
    run = prev !== null && Math.round((t - prev) / oneDay) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = t;
  }

  const since = (ms: number) => s.log.filter((e) => e.at >= ms).length;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // 월요일 시작
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    all: sum(null),
    ot: sum("OT"),
    nt: sum("NT"),
    books,
    perDay,
    streak,
    longest,
    today: perDay.get(dayKey(now)) ?? 0,
    week: since(weekStart.getTime()),
    month: since(monthStart.getTime()),
    totalReads: s.log.length,
    activeDays: perDay.size,
    completedBooks: books.filter((x) => x.read === x.book.chapters).length,
  };
}
