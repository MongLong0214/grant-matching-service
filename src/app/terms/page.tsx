import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: '이용약관',
  description: '혜택찾기 서비스 이용약관',
}

const TermsPage = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        홈으로 돌아가기
      </Link>

      <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">이용약관</h1>
      <p className="mb-10 text-sm text-muted-foreground">최종 수정일: 2026년 2월 17일</p>

      <div className="space-y-10 text-[15px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제1조 (목적)</h2>
          <p>
            본 약관은 혜택찾기(이하 &ldquo;서비스&rdquo;)가 제공하는 정부 혜택 매칭 서비스의
            이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제2조 (서비스 내용)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>서비스는 사용자가 입력한 사업 정보를 기반으로 정부 지원사업 데이터베이스와 매칭하여 신청 가능한 지원금 정보를 제공합니다.</li>
            <li>서비스는 지원금 정보의 조회 및 매칭 결과 제공만을 목적으로 하며, 실제 지원금 신청 대행이나 수령을 보장하지 않습니다.</li>
            <li>서비스에서 제공하는 정보는 공공데이터 포털, 중소벤처기업부, 소상공인시장진흥공단 등 공공기관의 데이터를 기반으로 합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제3조 (서비스 이용)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>서비스는 회원가입 없이 누구나 무료로 이용할 수 있습니다.</li>
            <li>사용자는 정확한 사업 정보를 입력해야 하며, 허위 정보 입력에 따른 부정확한 결과에 대해 서비스는 책임지지 않습니다.</li>
            <li>서비스는 24시간 운영을 원칙으로 하나, 시스템 점검 등의 사유로 일시적으로 중단될 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제4조 (데이터 처리)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>사용자가 입력한 사업 정보(업종, 지역, 매출, 직원 수, 업력)는 지원금 매칭 분석에만 사용됩니다.</li>
            <li>진단 결과는 고유 ID를 통해 조회할 수 있으며, 일정 기간 후 자동으로 삭제됩니다.</li>
            <li>서비스는 사용자의 개인 식별 정보(이름, 연락처, 사업자등록번호 등)를 수집하지 않습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제5조 (면책사항)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>서비스가 제공하는 지원금 정보는 참고용이며, 실제 지원 자격 및 선정 여부는 해당 사업의 담당 기관 심사에 따라 결정됩니다.</li>
            <li>공공데이터의 변경, 오류 또는 누락으로 인한 정보의 불일치에 대해 서비스는 책임을 지지 않습니다.</li>
            <li>서비스 이용으로 발생한 간접적, 부수적, 결과적 손해에 대해 서비스는 책임을 지지 않습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제6조 (책임의 제한)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>서비스는 무료로 제공되며, 서비스의 중단, 데이터 손실, 매칭 결과의 오류 등으로 인한 손해에 대해 법령이 허용하는 범위 내에서 책임을 제한합니다.</li>
            <li>천재지변, 시스템 장애 등 불가항력적 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제7조 (지적재산권)</h2>
          <p>
            서비스에 포함된 디자인, 로고, 소프트웨어 등 모든 지적재산권은 혜택찾기에 귀속됩니다.
            사용자는 서비스를 이용할 권리만을 가지며, 서비스의 콘텐츠를 무단 복제, 배포, 수정할 수 없습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제8조 (약관의 변경)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>서비스는 필요한 경우 본 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 효력이 발생합니다.</li>
            <li>변경된 약관에 동의하지 않는 경우, 사용자는 서비스 이용을 중단할 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">제9조 (준거법 및 관할)</h2>
          <p>
            본 약관은 대한민국 법률에 따라 규율되며, 서비스 이용과 관련된 분쟁은
            민사소송법상 관할법원에서 해결합니다.
          </p>
        </section>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-6">
          <p className="text-sm text-muted-foreground">
            본 약관에 대한 문의사항이 있으시면{' '}
            <a href="mailto:support@gogov.co.kr" className="font-medium text-primary hover:underline">
              support@gogov.co.kr
            </a>
            로 연락해 주시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TermsPage
