import { Suspense } from "react";
import type { Metadata } from "next";
import BookList from "@/components/BookList";

export const metadata: Metadata = { title: "목차" };

export default function BooksPage() {
  return (
    <Suspense>
      <BookList />
    </Suspense>
  );
}
