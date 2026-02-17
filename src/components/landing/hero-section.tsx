import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  CheckCircle,
  Shield,
  Zap,
  Building2,
  User,
} from 'lucide-react'

export const HeroSection = () => {
  return (
    <section aria-label="서비스 소개" className="relative overflow-hidden bg-gradient-to-b from-background via-background to-emerald-50/30 px-4 pb-24 pt-16 sm:pb-32 sm:pt-24">
      {/* 도트 그리드 배경 패턴 */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        role="img"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* 깊이감을 위한 그라디언트 오브 */}
      <div className="absolute -left-48 top-0 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[100px]" role="img" aria-hidden="true" />
      <div className="absolute -right-48 bottom-0 h-[600px] w-[600px] rounded-full bg-emerald-400/[0.06] blur-[120px]" role="img" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/[0.03] blur-[80px]" role="img" aria-hidden="true" />

      <div className="relative mx-auto max-w-5xl">
        {/* 상단 배지 */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-white/70 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            2026년 최신 정부 혜택 데이터 반영
          </div>
        </div>

        {/* 그라디언트 헤드라인 */}
        <h1 className="mb-6 text-center text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="text-foreground">나에게 맞는 정부 혜택,</span>
          <br />
          <span
            className="bg-gradient-to-r from-primary via-emerald-500 to-teal-500 bg-clip-text text-transparent"
          >
            30초면 찾아드립니다
          </span>
        </h1>

        {/* 부제목 */}
        <p className="mx-auto mb-12 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground sm:text-xl">
          간단한 정보만 입력하면 <strong className="font-semibold text-foreground">6,000개 이상</strong>의 정부 지원사업 중
          <br className="hidden sm:inline" />
          {' '}받을 수 있는 혜택을 <strong className="font-semibold text-foreground">무료</strong>로 분석해드립니다
        </p>

        {/* 듀얼 CTA 버튼 */}
        <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-13 w-full rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 sm:w-auto sm:text-lg"
          >
            <Link href="/diagnose?type=personal" className="inline-flex items-center gap-2">
              <User className="h-5 w-5" aria-hidden="true" />
              개인 혜택 찾기
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-13 w-full rounded-xl border-border/60 bg-white/50 px-8 text-base font-medium backdrop-blur-sm transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/80 sm:w-auto sm:text-lg"
          >
            <Link href="/diagnose?type=business" className="inline-flex items-center gap-2">
              <Building2 className="h-5 w-5" aria-hidden="true" />
              사업자 지원금 찾기
            </Link>
          </Button>
        </div>

        {/* 신뢰 지표 */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" />
            회원가입 없이 조회
          </span>
          <span className="hidden h-3 w-px bg-border sm:inline-block" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
            개인정보 보호
          </span>
          <span className="hidden h-3 w-px bg-border sm:inline-block" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
            100% 무료 서비스
          </span>
        </div>
      </div>
    </section>
  )
}
