import {
  Zap,
  Target,
  Shield,
  TrendingUp,
  RefreshCw,
  Clock,
} from 'lucide-react'

export const FeaturesSection = () => {
  return (
    <section aria-label="서비스 특장점" className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        {/* 섹션 헤더 */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Why 혜택찾기
          </p>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            왜 혜택찾기를 선택해야 할까요?
          </h2>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            개인도 사업자도, 더 정확하고 완전 무료입니다
          </p>
        </div>

        {/* 기능 그리드 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {/* 기능 1 */}
          <div className="group flex flex-col rounded-2xl border border-border/60 bg-white p-7 transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-md">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-300 group-hover:bg-primary/10">
              <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              실시간 데이터 분석
            </h3>
            <p className="flex-1 text-[15px] leading-relaxed text-muted-foreground">
              공공데이터 포털과 연동하여 최신 지원사업 정보를 실시간으로 분석합니다.
            </p>
          </div>

          {/* 기능 2 */}
          <div className="group flex flex-col rounded-2xl border border-border/60 bg-white p-7 transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-md">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-300 group-hover:bg-primary/10">
              <Target className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              정확한 조건 매칭
            </h3>
            <p className="flex-1 text-[15px] leading-relaxed text-muted-foreground">
              개인은 7가지, 사업자는 6가지 핵심 조건을 분석하여 실제 신청 가능한 혜택만 추천합니다.
            </p>
          </div>

          {/* 기능 3 */}
          <div className="group flex flex-col rounded-2xl border border-border/60 bg-white p-7 transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-md">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-300 group-hover:bg-primary/10">
              <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              안전한 정보 보호
            </h3>
            <p className="flex-1 text-[15px] leading-relaxed text-muted-foreground">
              입력하신 정보는 혜택 분석 목적으로만 사용되며, 별도 저장 없이 즉시 폐기됩니다.
            </p>
          </div>

          {/* 기능 4 */}
          <div className="group flex flex-col rounded-2xl border border-border/60 bg-white p-7 transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-md">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-300 group-hover:bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              놓치는 혜택 방지
            </h3>
            <p className="flex-1 text-[15px] leading-relaxed text-muted-foreground">
              자격이 되면서도 몰라서 놓치는 복지 혜택과 지원금을 찾아드립니다.
            </p>
          </div>

          {/* 기능 5 */}
          <div className="group flex flex-col rounded-2xl border border-border/60 bg-white p-7 transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-md">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-300 group-hover:bg-primary/10">
              <RefreshCw className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              매일 업데이트
            </h3>
            <p className="flex-1 text-[15px] leading-relaxed text-muted-foreground">
              신규 지원사업이 추가될 때마다 데이터베이스가 자동으로 업데이트됩니다.
            </p>
          </div>

          {/* 기능 6 */}
          <div className="group flex flex-col rounded-2xl border border-border/60 bg-white p-7 transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-md">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-300 group-hover:bg-primary/10">
              <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              30초 초간단 진단
            </h3>
            <p className="flex-1 text-[15px] leading-relaxed text-muted-foreground">
              복잡한 서류 없이 간단한 선택만으로 맞춤 지원금을 바로 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
