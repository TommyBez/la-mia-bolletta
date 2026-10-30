import Link from "next/link";
import { ComparisonWorkspace } from "@/components/comparison/workspace";
export default function ComparisonPage() {
  return (
    <main className="min-h-screen bg-[#f6f7ef] text-[#263b32]">
      <header className="border-b border-[#e1e6da] px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-[#234e35]"
          >
            la mia bolletta<span className="ml-1 text-[#97af7d]">↗</span>
          </Link>
          <span className="text-xs text-[#52604d]">
            Più chiarezza, meno sorprese.
          </span>
        </div>
      </header>
      <ComparisonWorkspace />
    </main>
  );
}
