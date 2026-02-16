import {
  FileEdit,
  BadgeCheck,
  Users,
} from 'lucide-react'

export const HowItWorks = () => {
  return (
    <section id="how-it-works" aria-label="이용 방법" className="relative bg-muted/20 px-4 py-20 sm:py-24">
      {/* 배경 패턴 */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        role="img"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* 섹션 헤더 */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            How It Works
          </p>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            이용 방법은 간단합니다
          </h2>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            몇 번의 클릭만으로 맞춤 혜택을 확인하세요
          </p>
        </div>

        {/* 연결선이 있는 단계 */}
        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {/* 연결선 (데스크톱 전용) */}
          <div className="absolute left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] top-[60px] hidden h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 md:block" aria-hidden="true" />

          {/* 단계 1 */}
          <div className="group relative">
            <div className="relative flex h-full flex-col rounded-2xl border border-border/60 bg-white p-8 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/25 hover:shadow-lg">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-primary/20 bg-primary/5 font-bold text-primary transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-primary/10">
                  01
                </div>
                <Users className="h-6 w-6 text-muted-foreground/30 transition-colors duration-300 group-hover:text-primary/50" aria-hidden="true" />
              </div>

              <h3 className="mb-3 text-xl font-semibold text-foreground">
                유형 선택
              </h3>
              <p className="mb-6 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                개인 혜택과 사업자 지원금 중 원하는 유형을 선택하세요.
                회원가입 없이 바로 시작할 수 있습니다.
              </p>

              {/* 진행 표시기 */}
              <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700 group-hover:w-full" />
              </div>
            </div>
          </div>

          {/* 단계 2 */}
          <div className="group relative">
            <div className="relative flex h-full flex-col rounded-2xl border border-border/60 bg-white p-8 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/25 hover:shadow-lg">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-primary/20 bg-primary/5 font-bold text-primary transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-primary/10">
                  02
                </div>
                <FileEdit className="h-6 w-6 text-muted-foreground/30 transition-colors duration-300 group-hover:text-primary/50" aria-hidden="true" />
              </div>

              <h3 className="mb-3 text-xl font-semibold text-foreground">
                간편 입력 (30초)
              </h3>
              <p className="mb-6 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                연령, 지역, 소득 수준 등 간단한 정보만 선택하면 됩니다. 복잡한 서류는 필요 없습니다.
              </p>

              <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700 group-hover:w-full" />
              </div>
            </div>
          </div>

          {/* 단계 3 */}
          <div className="group relative">
            <div className="relative flex h-full flex-col rounded-2xl border border-border/60 bg-white p-8 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/25 hover:shadow-lg">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-primary/20 bg-primary/5 font-bold text-primary transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-primary/10">
                  03
                </div>
                <BadgeCheck className="h-6 w-6 text-muted-foreground/30 transition-colors duration-300 group-hover:text-primary/50" aria-hidden="true" />
              </div>

              <h3 className="mb-3 text-xl font-semibold text-foreground">
                맞춤 결과 확인
              </h3>
              <p className="mb-6 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                신청 가능한 혜택 목록과 상세 조건, 신청 방법을 한눈에 확인하세요.
              </p>

              <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-primary to-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
