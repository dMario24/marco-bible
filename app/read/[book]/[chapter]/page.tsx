import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBook } from "@/lib/books";
import { getChapter } from "@/lib/knb";
import ReaderView from "@/components/ReaderView";

function resolve(book: string, chapter: string) {
  const b = getBook(book);
  const n = Number(chapter);
  if (!b || !Number.isInteger(n) || n < 1 || n > b.chapters) return null;
  return { book: b, chapter: n };
}

export async function generateMetadata({ params }: PageProps<"/read/[book]/[chapter]">): Promise<Metadata> {
  const { book, chapter } = await params;
  const r = resolve(book, chapter);
  return { title: r ? `${r.book.name} ${r.chapter}장` : "성경" };
}

async function Chapter({ params }: { params: PageProps<"/read/[book]/[chapter]">["params"] }) {
  const { book, chapter } = await params;
  const r = resolve(book, chapter);
  if (!r) notFound();
  const data = await getChapter(r.book.code, r.chapter);
  return <ReaderView code={r.book.code} chapter={r.chapter} blocks={data.blocks} />;
}

function ReaderSkeleton() {
  return (
    <div className="px-5 pt-20 space-y-4 animate-pulse" aria-label="불러오는 중">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="h-4 rounded bg-surface-2" style={{ width: `${70 + ((i * 37) % 30)}%` }} />
      ))}
    </div>
  );
}

export default function Page({ params }: PageProps<"/read/[book]/[chapter]">) {
  return (
    <Suspense fallback={<ReaderSkeleton />}>
      <Chapter params={params} />
    </Suspense>
  );
}
