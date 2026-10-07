import ClientOnly from "@/components/ClientOnly";
import Home from "@/components/Home";

export default function Page() {
  return (
    <ClientOnly fallback={<div className="px-5 pt-24 text-center text-sm text-ink-3">불러오는 중…</div>}>
      <Home />
    </ClientOnly>
  );
}
