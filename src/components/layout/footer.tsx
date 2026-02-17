import Link from 'next/link'
import { Wallet } from 'lucide-react'

export function Footer() {
  return (
    <footer role="contentinfo" className="w-full border-t border-border/50 bg-muted/30 py-10">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="flex flex-col gap-6 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-bold">혜택찾기</span>
          </div>
          <div className="flex justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="transition-colors duration-200 hover:text-foreground">
              이용약관
            </Link>
            <Link href="/privacy" className="transition-colors duration-200 hover:text-foreground">
              개인정보처리방침
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 혜택찾기. All rights reserved.
          </p>
        </div>
        <p className="mt-6 text-xs text-muted-foreground/60">
          본 서비스는 정부 혜택 정보를 제공하는 서비스이며, 실제 혜택 신청 및 승인은 각 사업 담당 기관의 심사를 거쳐 결정됩니다.
          제공되는 정보는 참고용이며, 실제 지원 가능 여부는 담당 기관에 문의하시기 바랍니다.
        </p>
      </div>
    </footer>
  )
}
