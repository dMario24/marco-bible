"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const noop = () => () => {};

/** 기기에 저장된 기록·현재 시각에 의존하는 화면은 브라우저에서만 렌더링 */
export default function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return mounted ? children : fallback;
}
