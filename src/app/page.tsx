import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, FileEdit, Bot, BadgeCheck } from 'lucide-react'

/**
 * 랜딩 페이지 - Stitch 디자인 적용
 *
 * 서비스 소개 + 무료 진단 시작 CTA
 * 3초 안에 서비스 이해 + 진단 시작 유도
 */
export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-emerald-50/50 px-4 py-20 sm:py-32">
        {/* Decorative blurred circles */}
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge with pulse */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            AI 기반 실시간 조회
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            사업자를 위한 정부지원금,
            <br />
            <span className="text-primary">30초면 찾아드립니다</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            사업 정보만 입력하면 AI가 95,000개 지원사업 중<br className="hidden sm:inline" />
            {' '}받을 수 있는 지원금을 무료로 분석해드립니다
          </p>

          {/* CTA Button */}
          <div className="mb-6 flex justify-center">
            <Button
              asChild
              size="lg"
              className="h-14 bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-xl sm:text-lg"
            >
              <Link href="/diagnose" className="inline-flex items-center gap-2">
                무료 진단 시작하기
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Trust indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-primary" />
            회원가입 없이 조회 가능
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-background py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-8 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="pt-8 text-center sm:pt-0">
              <p className="font-display text-4xl font-bold text-foreground md:text-5xl">95,000+</p>
              <p className="mt-2 text-sm text-muted-foreground">정부 지원사업 데이터베이스</p>
            </div>
            <div className="pt-8 text-center sm:pt-0">
              <p className="font-display text-4xl font-bold text-foreground md:text-5xl">30초</p>
              <p className="mt-2 text-sm text-muted-foreground">평균 진단 소요시간</p>
            </div>
            <div className="pt-8 text-center sm:pt-0">
              <p className="font-display text-4xl font-bold text-foreground md:text-5xl">5가지</p>
              <p className="mt-2 text-sm text-muted-foreground">맞춤 조건 분석</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              이용 방법은 간단합니다
            </h2>
            <p className="text-lg text-muted-foreground">
              몇 번의 클릭만으로 맞춤 지원금을 확인하세요
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="group rounded-2xl border border-border bg-background p-8 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <FileEdit className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                사업 정보 입력
              </h3>
              <p className="mb-6 text-muted-foreground">
                업종, 지역, 매출, 직원 수 등 간단한 정보만 선택하세요
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/3 rounded-full bg-primary transition-all group-hover:w-full"></div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group rounded-2xl border border-border bg-background p-8 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                AI 자동 매칭
              </h3>
              <p className="mb-6 text-muted-foreground">
                입력하신 조건에 맞는 지원금을 실시간으로 분석합니다
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 rounded-full bg-primary transition-all group-hover:w-full"></div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group rounded-2xl border border-border bg-background p-8 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <BadgeCheck className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                맞춤 결과 확인
              </h3>
              <p className="mb-6 text-muted-foreground">
                신청 가능한 지원금 목록과 상세 정보를 바로 확인하세요
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-full rounded-full bg-primary"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-emerald-400 px-8 py-16 text-center shadow-2xl sm:px-16">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              지금 바로 무료 진단을 시작하세요
            </h2>
            <p className="mb-8 text-lg text-white/90">
              30초면 놓치고 있던 지원금을 찾을 수 있습니다
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="h-14 bg-white px-8 text-base font-semibold text-primary shadow-lg transition-all hover:scale-105 hover:bg-white/90 sm:text-lg"
            >
              <Link href="/diagnose" className="inline-flex items-center gap-2">
                무료 진단 시작하기
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
