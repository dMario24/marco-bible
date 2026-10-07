/**
 * bible.cbck.or.kr/Knb 의 각 장을 받아 data/knb/{code}/{chapter}.json 으로 저장합니다.
 * 개인적 사용(오프라인 읽기) 용도이며, data/ 는 git에 포함되지 않습니다.
 *
 *   npm run crawl              # 전체
 *   npm run crawl -- Mt Mk     # 특정 책만
 *
 * 이미 저장된 장은 건너뛰며, 원 사이트에 부담을 주지 않도록 요청 간 지연을 둡니다.
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { BOOKS } from "../lib/books.ts";
import { parseChapterHtml } from "../lib/parse.ts";

const BASE = "https://bible.cbck.or.kr/Knb";
const OUT = path.join(process.cwd(), "data", "knb");
const DELAY_MS = 500;

const only = new Set(process.argv.slice(2));
const books = only.size ? BOOKS.filter((b) => only.has(b.code)) : BOOKS;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function fetchChapter(code: string, chapter: number) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${BASE}/${code}/${chapter}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; marco-bible crawler)" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseChapterHtml(await res.text(), code, chapter);
    } catch (e) {
      if (attempt >= 3) throw e;
      await sleep(2000 * attempt);
    }
  }
}

const total = books.reduce((n, b) => n + b.chapters, 0);
let done = 0;
const failed: string[] = [];

for (const book of books) {
  await mkdir(path.join(OUT, book.code), { recursive: true });
  for (let ch = 1; ch <= book.chapters; ch++) {
    done++;
    const file = path.join(OUT, book.code, `${ch}.json`);
    if (await exists(file)) continue;
    try {
      const data = await fetchChapter(book.code, ch);
      await writeFile(file, JSON.stringify(data));
      process.stdout.write(`\r[${done}/${total}] ${book.name} ${ch}장          `);
    } catch (e) {
      failed.push(`${book.code} ${ch}: ${(e as Error).message}`);
    }
    await sleep(DELAY_MS);
  }
}

console.log(`\n완료: ${total - failed.length}/${total}`);
if (failed.length) {
  console.log("실패:\n" + failed.join("\n"));
  process.exitCode = 1;
}
