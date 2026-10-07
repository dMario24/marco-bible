"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/lib/progress";

/** 마지막으로 읽던 곳으로 이동 */
export default function ContinueReading() {
  const router = useRouter();
  const { state, ready } = useProgress();

  useEffect(() => {
    if (!ready) return;
    const last = state.last;
    router.replace(last ? `/read/${last.code}/${last.chapter}${last.verse ? `?v=${last.verse}` : ""}` : "/read/Gn/1");
  }, [ready, state.last, router]);

  return <p className="pt-24 text-center text-ink-3 text-sm">읽던 곳으로 이동하는 중…</p>;
}
