import { Star } from 'lucide-react'

export const TestimonialsSection = () => {
  return (
    <section aria-label="사용자 후기" className="relative overflow-hidden bg-muted/20 px-4 py-20 sm:py-24">
      {/* 배경 장식 */}
      <div className="absolute -left-32 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-primary/[0.03] blur-[80px]" role="img" aria-hidden="true" />
      <div className="absolute -right-32 top-1/3 h-[300px] w-[300px] rounded-full bg-emerald-300/[0.04] blur-[60px]" role="img" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Testimonials
          </p>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            실제 사용자 후기
          </h2>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            혜택찾기를 통해 정부 혜택을 찾은 분들의 이야기
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* 후기 1 -- 개인 */}
          <div className="flex flex-col rounded-2xl border border-border/60 bg-white/80 p-7 shadow-sm backdrop-blur-sm transition-[box-shadow] duration-300 hover:shadow-md">
            <div className="mb-4 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={`t1-${i}`} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              ))}
              <span className="sr-only">별점 5점 만점</span>
            </div>
            <p className="mb-6 flex-1 text-[15px] leading-relaxed text-muted-foreground">
              &ldquo;신혼부부 전세자금 대출이랑 출산지원금을 여기서 한번에 찾았어요. 하나하나 검색할 필요 없어서 정말 편했습니다.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                최
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">최수진</p>
                <p className="text-xs text-muted-foreground">신혼부부 / 경기</p>
              </div>
            </div>
          </div>

          {/* 후기 2 -- 사업자 */}
          <div className="flex flex-col rounded-2xl border border-border/60 bg-white/80 p-7 shadow-sm backdrop-blur-sm transition-[box-shadow] duration-300 hover:shadow-md">
            <div className="mb-4 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={`t2-${i}`} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              ))}
              <span className="sr-only">별점 5점 만점</span>
            </div>
            <p className="mb-6 flex-1 text-[15px] leading-relaxed text-muted-foreground">
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

          {/* 후기 3 -- 개인 */}
          <div className="flex flex-col rounded-2xl border border-border/60 bg-white/80 p-7 shadow-sm backdrop-blur-sm transition-[box-shadow] duration-300 hover:shadow-md">
            <div className="mb-4 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={`t3-${i}`} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              ))}
              <span className="sr-only">별점 5점 만점</span>
            </div>
            <p className="mb-6 flex-1 text-[15px] leading-relaxed text-muted-foreground">
              &ldquo;취준생인데 청년 주거지원금이랑 취업장려금을 30초 만에 찾았습니다. 몰랐으면 그냥 지나칠 뻔했어요.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                이
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">이하은</p>
                <p className="text-xs text-muted-foreground">취업준비생 / 서울</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
