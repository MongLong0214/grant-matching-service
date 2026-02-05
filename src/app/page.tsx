import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  CheckCircle,
  FileEdit,
  Search,
  BadgeCheck,
  Shield,
  Zap,
  Clock,
  TrendingUp,
  Building2,
  Users,
  Star,
  ChevronDown,
  Database,
  RefreshCw,
  Target,
} from 'lucide-react'

/**
 * Enterprise-grade landing page for 정부지원금 매칭 서비스
 *
 * Sections: Hero -> Trust Bar -> Stats -> How It Works ->
 *           Features -> Testimonials -> FAQ -> Final CTA
 */
export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ============================================================
          HERO SECTION
          - Dot grid background pattern
          - Gradient text headline
          - Dual CTA buttons
          - Trust indicators
          ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-emerald-50/30 px-4 pb-24 pt-16 sm:pb-32 sm:pt-24">
        {/* Dot grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Gradient orbs for depth */}
        <div className="absolute -left-48 top-0 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="absolute -right-48 bottom-0 h-[600px] w-[600px] rounded-full bg-emerald-400/[0.06] blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/[0.03] blur-[80px]" />

        <div className="relative mx-auto max-w-5xl">
          {/* Top badge */}
          <div className="mb-10 flex justify-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-white/70 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              2025년 최신 지원사업 데이터 반영
            </div>
          </div>

          {/* Headline with gradient text */}
          <h1 className="mb-6 text-center text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-foreground">사업자를 위한 정부지원금,</span>
            <br />
            <span
              className="bg-gradient-to-r from-primary via-emerald-500 to-teal-500 bg-clip-text text-transparent"
            >
              30초면 찾아드립니다
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-12 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground sm:text-xl">
            사업 정보만 입력하면 <strong className="font-semibold text-foreground">95,000개 이상</strong>의 지원사업 중
            <br className="hidden sm:inline" />
            {' '}받을 수 있는 지원금을 <strong className="font-semibold text-foreground">무료</strong>로 분석해드립니다
          </p>

          {/* Dual CTA buttons */}
          <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-13 w-full rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 sm:w-auto sm:text-lg"
            >
              <Link href="/diagnose" className="inline-flex items-center gap-2">
                무료 진단 시작하기
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-13 w-full rounded-xl border-border/60 bg-white/50 px-8 text-base font-medium backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/80 sm:w-auto sm:text-lg"
            >
              <Link href="#how-it-works" className="inline-flex items-center gap-2">
                이용 방법 알아보기
              </Link>
            </Button>
          </div>

          {/* Trust indicators row */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-primary" />
              회원가입 없이 조회
            </span>
            <span className="hidden h-3 w-px bg-border sm:inline-block" />
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-primary" />
              개인정보 보호
            </span>
            <span className="hidden h-3 w-px bg-border sm:inline-block" />
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              100% 무료 서비스
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================
          SOCIAL PROOF / TRUST BAR
          Scrolling logos / usage count strip
          ============================================================ */}
      <section className="border-y border-border/60 bg-muted/30 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2 font-medium text-foreground">
            <Users className="h-4 w-4 text-primary" />
            10,000+ 사업자가 이용중
          </span>
          <span className="hidden h-4 w-px bg-border/60 sm:block" />
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground/60" />
            중소벤처기업부 데이터 연동
          </span>
          <span className="hidden h-4 w-px bg-border/60 sm:block" />
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground/60" />
            매일 업데이트
          </span>
          <span className="hidden h-4 w-px bg-border/60 sm:block" />
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground/60" />
            공공데이터 기반
          </span>
        </div>
      </section>

      {/* ============================================================
          STATS SECTION
          Three stat cards with icons and visual weight
          ============================================================ */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {/* Stat 1 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-8 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[0.04] transition-transform duration-500 group-hover:scale-150" />
              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <p className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  95,000<span className="text-primary">+</span>
                </p>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  정부 지원사업 데이터베이스
                </p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-8 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[0.04] transition-transform duration-500 group-hover:scale-150" />
              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <p className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  30<span className="text-primary">초</span>
                </p>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  평균 진단 소요시간
                </p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-8 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[0.04] transition-transform duration-500 group-hover:scale-150" />
              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <p className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  5<span className="text-primary">가지</span>
                </p>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  맞춤 조건 분석 항목
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
          Numbered steps with connecting line
          ============================================================ */}
      <section id="how-it-works" className="relative bg-muted/20 px-4 py-20 sm:py-24">
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              How It Works
            </p>
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              이용 방법은 간단합니다
            </h2>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              몇 번의 클릭만으로 맞춤 지원금을 확인하세요
            </p>
          </div>

          {/* Steps with connector */}
          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
            {/* Connecting line (desktop only) */}
            <div className="absolute left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] top-[60px] hidden h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 md:block" />

            {/* Step 1 */}
            <div className="group relative">
              <div className="relative rounded-2xl border border-border/60 bg-white p-8 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-lg">
                {/* Step number */}
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-primary/20 bg-primary/5 font-bold text-primary transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-primary/10">
                    01
                  </div>
                  <FileEdit className="h-6 w-6 text-muted-foreground/30 transition-colors duration-300 group-hover:text-primary/50" />
                </div>

                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  사업 정보 입력
                </h3>
                <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                  업종, 지역, 매출, 직원 수 등 간단한 사업 정보만 선택하세요.
                  회원가입 없이 바로 시작할 수 있습니다.
                </p>

                {/* Progress indicator */}
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700 group-hover:w-full" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative">
              <div className="relative rounded-2xl border border-border/60 bg-white p-8 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-lg">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-primary/20 bg-primary/5 font-bold text-primary transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-primary/10">
                    02
                  </div>
                  <Search className="h-6 w-6 text-muted-foreground/30 transition-colors duration-300 group-hover:text-primary/50" />
                </div>

                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  자동 조건 매칭
                </h3>
                <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                  입력하신 조건과 95,000개 이상의 지원사업 데이터를 실시간으로 비교 분석합니다.
                </p>

                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700 group-hover:w-full" />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative">
              <div className="relative rounded-2xl border border-border/60 bg-white p-8 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-lg">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-primary/20 bg-primary/5 font-bold text-primary transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-primary/10">
                    03
                  </div>
                  <BadgeCheck className="h-6 w-6 text-muted-foreground/30 transition-colors duration-300 group-hover:text-primary/50" />
                </div>

                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  맞춤 결과 확인
                </h3>
                <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                  신청 가능한 지원금 목록과 상세 조건, 신청 방법을 한눈에 확인하세요.
                </p>

                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-primary to-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURES SECTION
          Why choose us: grid of value propositions
          ============================================================ */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              Why Grant Match
            </p>
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              왜 Grant Match를 선택해야 할까요?
            </h2>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              더 정확하고, 더 빠르고, 완전 무료입니다
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-border/60 bg-white p-7 transition-all duration-300 hover:border-primary/20 hover:shadow-md">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-300 group-hover:bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                실시간 데이터 분석
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                공공데이터 포털과 연동하여 최신 지원사업 정보를 실시간으로 분석합니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-border/60 bg-white p-7 transition-all duration-300 hover:border-primary/20 hover:shadow-md">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-300 group-hover:bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                정확한 조건 매칭
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                업종, 지역, 규모 등 5가지 핵심 조건을 분석하여 실제 신청 가능한 지원금만 추천합니다.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-border/60 bg-white p-7 transition-all duration-300 hover:border-primary/20 hover:shadow-md">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-300 group-hover:bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                안전한 정보 보호
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                입력하신 사업 정보는 진단 목적으로만 사용되며, 별도 저장 없이 즉시 폐기됩니다.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border border-border/60 bg-white p-7 transition-all duration-300 hover:border-primary/20 hover:shadow-md">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-300 group-hover:bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                놓치는 지원금 방지
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                대부분의 사업자가 자격이 되면서도 몰라서 놓치는 지원금을 찾아드립니다.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-2xl border border-border/60 bg-white p-7 transition-all duration-300 hover:border-primary/20 hover:shadow-md">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-300 group-hover:bg-primary/10">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                매일 업데이트
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                신규 지원사업이 추가될 때마다 데이터베이스가 자동으로 업데이트됩니다.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-2xl border border-border/60 bg-white p-7 transition-all duration-300 hover:border-primary/20 hover:shadow-md">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-300 group-hover:bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                30초 초간단 진단
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                복잡한 서류 없이 간단한 선택만으로 맞춤 지원금을 바로 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          TESTIMONIALS / SOCIAL PROOF
          User quotes in glassmorphic cards
          ============================================================ */}
      <section className="relative overflow-hidden bg-muted/20 px-4 py-20 sm:py-24">
        {/* Background decoration */}
        <div className="absolute -left-32 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-primary/[0.03] blur-[80px]" />
        <div className="absolute -right-32 top-1/3 h-[300px] w-[300px] rounded-full bg-emerald-300/[0.04] blur-[60px]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              Testimonials
            </p>
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              실제 사용자 후기
            </h2>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              Grant Match를 통해 지원금을 찾은 사업자분들의 이야기
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="rounded-2xl border border-border/60 bg-white/80 p-7 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                &ldquo;카페 창업하면서 지원금이 있는지도 몰랐는데, 여기서 진단받고 청년창업지원금 3,000만원을 신청할 수 있었어요.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  김
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">김지원</p>
                  <p className="text-xs text-muted-foreground">카페 창업 / 서울</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="rounded-2xl border border-border/60 bg-white/80 p-7 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                &ldquo;직원 고용 관련 지원금을 찾고 있었는데, 생각보다 훨씬 많은 지원사업이 있다는 걸 알게 됐습니다. 정말 유용해요.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  박
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">박성민</p>
                  <p className="text-xs text-muted-foreground">제조업 / 경기</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="rounded-2xl border border-border/60 bg-white/80 p-7 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                &ldquo;30초 만에 결과가 나와서 깜짝 놀랐어요. 소상공인 지원금 2건을 찾았고 하나는 이미 신청 완료했습니다.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  이
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">이하은</p>
                  <p className="text-xs text-muted-foreground">온라인 쇼핑몰 / 부산</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FAQ SECTION
          Common questions in clean accordion-style layout
          ============================================================ */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              FAQ
            </p>
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              자주 묻는 질문
            </h2>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <details className="group rounded-2xl border border-border/60 bg-white transition-all duration-300 hover:border-primary/20 [&[open]]:border-primary/20 [&[open]]:shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between p-6 text-left text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                정말 무료인가요?
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
                네, Grant Match의 지원금 진단 서비스는 100% 무료입니다. 숨겨진 비용이나 추가 결제는 일절 없으며,
                회원가입 없이도 바로 이용하실 수 있습니다.
              </div>
            </details>

            {/* FAQ 2 */}
            <details className="group rounded-2xl border border-border/60 bg-white transition-all duration-300 hover:border-primary/20 [&[open]]:border-primary/20 [&[open]]:shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between p-6 text-left text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                어떤 지원금을 찾아주나요?
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
                중소벤처기업부, 소상공인시장진흥공단, 지방자치단체 등에서 운영하는 정부지원금, 보조금, 융자, 세금감면 등
                95,000개 이상의 지원사업을 분석합니다. 창업지원금, 고용지원금, 수출지원금, R&D 지원금 등 다양한 분야를 포함합니다.
              </div>
            </details>

            {/* FAQ 3 */}
            <details className="group rounded-2xl border border-border/60 bg-white transition-all duration-300 hover:border-primary/20 [&[open]]:border-primary/20 [&[open]]:shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between p-6 text-left text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                입력한 개인정보는 안전한가요?
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
                입력하신 사업 정보는 지원금 매칭 분석에만 사용되며, 분석 완료 후 즉시 폐기됩니다.
                별도의 데이터 저장이나 제3자 제공은 일절 하지 않습니다.
              </div>
            </details>

            {/* FAQ 4 */}
            <details className="group rounded-2xl border border-border/60 bg-white transition-all duration-300 hover:border-primary/20 [&[open]]:border-primary/20 [&[open]]:shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between p-6 text-left text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                진단 결과가 나온 후 어떻게 신청하나요?
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
                진단 결과에서 각 지원사업의 상세 정보와 함께 신청 방법, 담당기관 연락처를 제공합니다.
                해당 기관의 공식 채널을 통해 직접 신청하실 수 있습니다.
              </div>
            </details>

            {/* FAQ 5 */}
            <details className="group rounded-2xl border border-border/60 bg-white transition-all duration-300 hover:border-primary/20 [&[open]]:border-primary/20 [&[open]]:shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between p-6 text-left text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                개인사업자도 이용할 수 있나요?
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
                물론입니다. 개인사업자, 법인사업자, 예비창업자 모두 이용 가능합니다.
                사업 형태에 따라 맞춤형 지원금을 찾아드립니다.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA BANNER
          Emerald gradient with floating decorative elements
          ============================================================ */}
      <section className="px-4 pb-20 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-primary to-teal-600 px-8 py-16 text-center shadow-2xl shadow-primary/20 sm:px-16 sm:py-20">
            {/* Decorative floating elements */}
            <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/[0.06]" />
            <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-white/[0.04]" />
            <div className="absolute left-1/3 top-0 h-32 w-32 rounded-full bg-white/[0.03]" />

            {/* Dot pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            <div className="relative">
              {/* Urgency badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
                <RefreshCw className="h-3.5 w-3.5" />
                매일 새로운 지원금 업데이트
              </div>

              <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                지금 바로 무료 진단을
                <br />
                시작하세요
              </h2>
              <p className="mb-10 text-lg text-white/80 sm:text-xl">
                30초면 놓치고 있던 지원금을 찾을 수 있습니다
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  size="lg"
                  className="h-13 w-full rounded-xl bg-white px-8 text-base font-semibold text-emerald-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/95 hover:shadow-xl sm:w-auto sm:text-lg"
                >
                  <Link href="/diagnose" className="inline-flex items-center gap-2">
                    무료 진단 시작하기
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>

              {/* Bottom trust indicator */}
              <p className="mt-6 text-sm text-white/60">
                회원가입 불필요 -- 30초 만에 결과 확인
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
