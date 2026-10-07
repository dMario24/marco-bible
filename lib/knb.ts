import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { parseChapterHtml, type Chapter } from "./parse";

export const SOURCE_BASE = "https://bible.cbck.or.kr/Knb";

/** scripts/crawl.mjs 가 저장하는 로컬 캐시 (git에 포함되지 않음) */
const LOCAL_DIR = path.join(process.cwd(), "data", "knb");

async function readLocal(code: string, chapter: number): Promise<Chapter | null> {
  try {
    const json = await readFile(path.join(LOCAL_DIR, code, `${chapter}.json`), "utf8");
    return JSON.parse(json) as Chapter;
  } catch {
    return null;
  }
}

export async function getChapter(code: string, chapter: number): Promise<Chapter> {
  "use cache";
  cacheLife("max");

  const local = await readLocal(code, chapter);
  if (local) return local;

  const res = await fetch(`${SOURCE_BASE}/${code}/${chapter}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; marco-bible reader)" },
  });
  if (!res.ok) throw new Error(`원문을 불러오지 못했습니다 (${res.status})`);
  return parseChapterHtml(await res.text(), code, chapter);
}
