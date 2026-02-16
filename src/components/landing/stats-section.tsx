import {
  Database,
  Clock,
  Target,
} from 'lucide-react'

export const StatsSection = () => {
  return (
    <section aria-label="서비스 주요 수치" className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {/* 통계 1 */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-8 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-md">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[0.04] transition-transform duration-500 group-hover:scale-150" role="img" aria-hidden="true" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Database className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <p className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                6,000<span className="text-primary">+</span>
              </p>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                정부 지원사업 데이터베이스
              </p>
            </div>
          </div>

          {/* 통계 2 */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-8 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-md">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[0.04] transition-transform duration-500 group-hover:scale-150" role="img" aria-hidden="true" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Clock className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <p className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                30<span className="text-primary">초</span>
              </p>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                평균 진단 소요시간
              </p>
            </div>
          </div>

          {/* 통계 3 */}
          <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-8 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-md">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[0.04] transition-transform duration-500 group-hover:scale-150" role="img" aria-hidden="true" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Target className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <p className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                2<span className="text-primary">트랙</span>
              </p>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                개인 + 사업자 맞춤 분석
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
