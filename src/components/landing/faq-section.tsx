import { ChevronDown } from 'lucide-react'

export const FaqSection = () => {
  return (
    <section aria-label="자주 묻는 질문" className="px-4 py-20 sm:py-24">
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
          <details className="group rounded-2xl border border-border/60 bg-white transition-[box-shadow,border-color] duration-300 hover:border-primary/20 [&[open]]:border-primary/20 [&[open]]:shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between p-6 text-left text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              정말 무료인가요?
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
              네, 혜택찾기의 모든 진단 서비스는 100% 무료입니다. 숨겨진 비용이나 추가 결제는 일절 없으며,
              회원가입 없이도 바로 이용하실 수 있습니다.
            </div>
          </details>

          {/* FAQ 2 */}
          <details className="group rounded-2xl border border-border/60 bg-white transition-[box-shadow,border-color] duration-300 hover:border-primary/20 [&[open]]:border-primary/20 [&[open]]:shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between p-6 text-left text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              개인과 사업자 중 어떤 걸 선택해야 하나요?
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
              주거/육아/교육/건강 등 생활 복지 혜택을 찾으신다면 &lsquo;개인&rsquo;을, 창업/고용/수출/R&D 등
              사업 관련 지원금을 찾으신다면 &lsquo;사업자&rsquo;를 선택하세요. 두 가지 모두 진단받으실 수도 있습니다.
            </div>
          </details>

          {/* FAQ 3 */}
          <details className="group rounded-2xl border border-border/60 bg-white transition-[box-shadow,border-color] duration-300 hover:border-primary/20 [&[open]]:border-primary/20 [&[open]]:shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between p-6 text-left text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              어떤 혜택을 찾아주나요?
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
              복지로, 보조금24, 중소벤처기업부 등의 데이터를 연동하여 6,000개 이상의 정부 지원사업을 분석합니다.
              개인 복지(주거/육아/교육/건강)부터 사업자 지원금(창업/고용/수출/R&D)까지 폭넓게 다룹니다.
            </div>
          </details>

          {/* FAQ 4 */}
          <details className="group rounded-2xl border border-border/60 bg-white transition-[box-shadow,border-color] duration-300 hover:border-primary/20 [&[open]]:border-primary/20 [&[open]]:shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between p-6 text-left text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              입력한 정보는 안전한가요?
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
              입력하신 정보는 혜택 매칭 분석에만 사용되며, 분석 완료 후 즉시 폐기됩니다.
              별도의 데이터 저장이나 제3자 제공은 일절 하지 않습니다.
            </div>
          </details>

          {/* FAQ 5 */}
          <details className="group rounded-2xl border border-border/60 bg-white transition-[box-shadow,border-color] duration-300 hover:border-primary/20 [&[open]]:border-primary/20 [&[open]]:shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between p-6 text-left text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              진단 결과가 나온 후 어떻게 신청하나요?
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
              진단 결과에서 각 혜택의 상세 정보와 함께 신청 방법, 담당기관 연락처를 제공합니다.
              해당 기관의 공식 채널을 통해 직접 신청하실 수 있습니다.
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}
