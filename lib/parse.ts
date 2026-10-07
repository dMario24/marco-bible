export type Block =
  | { type: "heading"; text: string }
  | { type: "verse"; label: string; lines: string[] };

export type Chapter = {
  code: string;
  chapter: number;
  blocks: Block[];
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ldquo: "\u201c",
  rdquo: "\u201d",
  lsquo: "\u2018",
  rsquo: "\u2019",
  middot: "\u00b7",
  hellip: "\u2026",
  ndash: "\u2013",
  mdash: "\u2014",
};

function decode(s: string) {
  return s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** HTML 조각 → 줄 단위 텍스트 (주석 번호 제거, <br>은 줄바꿈) */
function toLines(html: string): string[] {
  return decode(
    html
      .replace(/<sup class="annotation">.*?<\/sup>/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** bible.cbck.or.kr/Knb/{code}/{chapter} 페이지 HTML을 구조화된 데이터로 변환 */
export function parseChapterHtml(html: string, code: string, chapter: number): Chapter {
  const start = html.indexOf('id="bibleContents"');
  if (start < 0) throw new Error(`본문 영역을 찾을 수 없습니다: ${code} ${chapter}`);
  const end = html.indexOf('id="submenu"', start);
  const body = html.slice(start, end < 0 ? undefined : end);

  const blocks: Block[] = [];
  for (const row of body.split('<div class="row">').slice(1)) {
    const heading = row.match(/<h3>([\s\S]*?)<\/h3>/);
    if (heading) {
      const text = toLines(heading[1]).join(" ");
      if (text) blocks.push({ type: "heading", text });
      continue;
    }
    const label = row.match(/class="highlight">([^<]*)</);
    const text = row.match(/<div class="text-justify">([\s\S]*?)<\/div>/);
    if (label && text) {
      blocks.push({ type: "verse", label: decode(label[1]).trim(), lines: toLines(text[1]) });
    }
  }
  if (!blocks.some((b) => b.type === "verse")) {
    throw new Error(`구절을 찾을 수 없습니다: ${code} ${chapter}`);
  }
  return { code, chapter, blocks };
}
