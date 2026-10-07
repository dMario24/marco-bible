export type Testament = "OT" | "NT";

export type Book = {
  /** 원본 사이트(bible.cbck.or.kr/Knb/{code}/{chapter})의 약어 */
  code: string;
  name: string;
  short: string;
  chapters: number;
  testament: Testament;
};

// 한국천주교주교회의 『성경』(2005) 목차 순서
const RAW: [string, string, string, number][] = [
  ["Gn", "창세기", "창세", 50],
  ["Ex", "탈출기", "탈출", 40],
  ["Lv", "레위기", "레위", 27],
  ["Nm", "민수기", "민수", 36],
  ["Dt", "신명기", "신명", 34],
  ["Jos", "여호수아기", "여호", 24],
  ["Jgs", "판관기", "판관", 21],
  ["Ru", "룻기", "룻", 4],
  ["1Sm", "사무엘기 상권", "1사무", 31],
  ["2Sm", "사무엘기 하권", "2사무", 24],
  ["1Kgs", "열왕기 상권", "1열왕", 22],
  ["2Kgs", "열왕기 하권", "2열왕", 25],
  ["1Chr", "역대기 상권", "1역대", 29],
  ["2Chr", "역대기 하권", "2역대", 36],
  ["Ezr", "에즈라기", "에즈", 10],
  ["Neh", "느헤미야기", "느헤", 13],
  ["Tb", "토빗기", "토빗", 14],
  ["Jdt", "유딧기", "유딧", 16],
  ["Est", "에스테르기", "에스", 10],
  ["1Mc", "마카베오기 상권", "1마카", 16],
  ["2Mc", "마카베오기 하권", "2마카", 15],
  ["Jb", "욥기", "욥", 42],
  ["Ps", "시편", "시편", 150],
  ["Prv", "잠언", "잠언", 31],
  ["Eccl", "코헬렛", "코헬", 12],
  ["Sng", "아가", "아가", 8],
  ["Wis", "지혜서", "지혜", 19],
  ["Sir", "집회서", "집회", 51],
  ["Is", "이사야서", "이사", 66],
  ["Jer", "예레미야서", "예레", 52],
  ["Lam", "애가", "애가", 5],
  ["Bar", "바룩서", "바룩", 6],
  ["Ez", "에제키엘서", "에제", 48],
  ["Dn", "다니엘서", "다니", 14],
  ["Hos", "호세아서", "호세", 14],
  ["Jl", "요엘서", "요엘", 4],
  ["Am", "아모스서", "아모", 9],
  ["Ob", "오바드야서", "오바", 1],
  ["Jon", "요나서", "요나", 4],
  ["Mi", "미카서", "미카", 7],
  ["Na", "나훔서", "나훔", 3],
  ["Hb", "하바쿡서", "하바", 3],
  ["Zep", "스바니야서", "스바", 3],
  ["Hg", "하까이서", "하까", 2],
  ["Zec", "즈카르야서", "즈카", 14],
  ["Mal", "말라키서", "말라", 3],
  ["Mt", "마태오 복음서", "마태", 28],
  ["Mk", "마르코 복음서", "마르", 16],
  ["Lk", "루카 복음서", "루카", 24],
  ["Jn", "요한 복음서", "요한", 21],
  ["Acts", "사도행전", "사도", 28],
  ["Rom", "로마 신자들에게 보낸 서간", "로마", 16],
  ["1Cor", "코린토 신자들에게 보낸 첫째 서간", "1코린", 16],
  ["2Cor", "코린토 신자들에게 보낸 둘째 서간", "2코린", 13],
  ["Gal", "갈라티아 신자들에게 보낸 서간", "갈라", 6],
  ["Eph", "에페소 신자들에게 보낸 서간", "에페", 6],
  ["Phil", "필리피 신자들에게 보낸 서간", "필리", 4],
  ["Col", "콜로새 신자들에게 보낸 서간", "콜로", 4],
  ["1Thes", "테살로니카 신자들에게 보낸 첫째 서간", "1테살", 5],
  ["2Thes", "테살로니카 신자들에게 보낸 둘째 서간", "2테살", 3],
  ["1Tm", "티모테오에게 보낸 첫째 서간", "1티모", 6],
  ["2Tm", "티모테오에게 보낸 둘째 서간", "2티모", 4],
  ["Ti", "티토에게 보낸 서간", "티토", 3],
  ["Phlm", "필레몬에게 보낸 서간", "필레", 1],
  ["Heb", "히브리인들에게 보낸 서간", "히브", 13],
  ["Jas", "야고보 서간", "야고", 5],
  ["1Pt", "베드로의 첫째 서간", "1베드", 5],
  ["2Pt", "베드로의 둘째 서간", "2베드", 3],
  ["1Jn", "요한의 첫째 서간", "1요한", 5],
  ["2Jn", "요한의 둘째 서간", "2요한", 1],
  ["3Jn", "요한의 셋째 서간", "3요한", 1],
  ["Jude", "유다 서간", "유다", 1],
  ["Rv", "요한 묵시록", "묵시", 22],
];

const NT_START = RAW.findIndex(([code]) => code === "Mt");

export const BOOKS: Book[] = RAW.map(([code, name, short, chapters], i) => ({
  code,
  name,
  short,
  chapters,
  testament: i < NT_START ? "OT" : "NT",
}));

const BY_CODE = new Map(BOOKS.map((b) => [b.code, b]));

export function getBook(code: string): Book | undefined {
  return BY_CODE.get(code);
}

export const TOTAL_CHAPTERS = BOOKS.reduce((n, b) => n + b.chapters, 0);

export function chapterKey(code: string, chapter: number) {
  return `${code}.${chapter}`;
}

/** 성경 전체 순서에서 다음/이전 장 */
export function adjacentChapter(code: string, chapter: number, dir: 1 | -1) {
  const idx = BOOKS.findIndex((b) => b.code === code);
  if (idx < 0) return null;
  const next = chapter + dir;
  if (next >= 1 && next <= BOOKS[idx].chapters) return { code, chapter: next };
  const other = BOOKS[idx + dir];
  if (!other) return null;
  return { code: other.code, chapter: dir === 1 ? 1 : other.chapters };
}
