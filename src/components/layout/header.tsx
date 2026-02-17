import Link from 'next/link'
import { Wallet } from 'lucide-react'

export function Header() {
  return (
    <header role="banner" className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">혜택찾기</span>
        </Link>
        <nav role="navigation" aria-label="메인 네비게이션" className="flex items-center">
          <Link
            href="/diagnose"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
          >
            무료 진단하기
          </Link>
        </nav>
      </div>
    </header>
  )
}
