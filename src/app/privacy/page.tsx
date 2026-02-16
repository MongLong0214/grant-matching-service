import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'Grant Match 개인정보처리방침',
}

const PrivacyPage = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        홈으로 돌아가기
      </Link>

      <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">개인정보처리방침</h1>
      <p className="mb-10 text-sm text-muted-foreground">최종 수정일: 2025년 1월 1일</p>

      <div className="space-y-10 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          Grant Match(이하 &ldquo;서비스&rdquo;)는 「개인정보 보호법」에 따라 이용자의 개인정보를 보호하고,
          이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            제1조 (수집하는 정보)
          </h2>
          <p className="mb-3">서비스는 지원금 매칭 분석을 위해 다음의 사업 정보만을 수집합니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>업종 (사업 분야)</li>
            <li>사업 소재지 (시/도 단위)</li>
            <li>직원 수 (규모 범위)</li>
            <li>연 매출 (규모 범위)</li>
            <li>사업 시작 시기 (업력)</li>
          </ul>
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">
              서비스는 개인 식별 정보를 수집하지 않습니다.
            </p>
            <p className="mt-1 text-sm">
              이름, 연락처, 이메일, 사업자등록번호 등 개인을 식별할 수 있는 정보는 일체 수집하지 않습니다.
              회원가입 절차가 없으며, 별도의 계정 생성 없이 서비스를 이용합니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            제2조 (수집 목적)
          </h2>
          <p>수집한 사업 정보는 다음의 목적으로만 사용됩니다.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>정부 지원사업 데이터베이스와의 조건 매칭 분석</li>
            <li>맞춤 지원금 추천 결과 생성 및 제공</li>
            <li>서비스 품질 향상을 위한 통계 분석 (비식별 데이터)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            제3조 (보유 및 이용 기간)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>진단 결과 데이터는 결과 조회를 위해 일정 기간 보관된 후 자동으로 삭제됩니다.</li>
            <li>서비스 이용 과정에서 생성되는 로그 데이터는 서비스 안정성을 위해 최대 90일간 보관 후 파기합니다.</li>
            <li>통계 목적으로 활용되는 데이터는 개인을 식별할 수 없는 형태로만 보관됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            제4조 (쿠키 및 분석 도구)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>서비스는 사용자 경험 개선 및 서비스 이용 통계를 위해 쿠키(Cookie)를 사용할 수 있습니다.</li>
            <li>서비스 분석을 위해 Google Analytics 등의 웹 분석 도구를 사용할 수 있으며, 이를 통해 수집되는 정보는 비식별 통계 데이터입니다.</li>
            <li>사용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며, 이 경우 서비스 이용에 제한은 없습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            제5조 (제3자 제공)
          </h2>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">
              서비스는 수집한 정보를 제3자에게 제공하지 않습니다.
            </p>
            <p className="mt-1 text-sm">
              사용자의 사업 정보는 외부 업체, 광고주, 기타 제3자에게 판매, 임대, 공유되지 않습니다.
              다만, 법령에 의해 요구되는 경우에는 관련 법률에 따라 정보를 제공할 수 있습니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            제6조 (정보의 안전성 확보)
          </h2>
          <p>서비스는 수집한 정보의 안전성 확보를 위해 다음의 조치를 취하고 있습니다.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>HTTPS 암호화 통신을 통한 데이터 전송</li>
            <li>접근 권한 관리 및 접근 통제</li>
            <li>정기적인 보안 점검</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            제7조 (이용자의 권리)
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>서비스는 개인 식별 정보를 수집하지 않으므로, 별도의 열람·정정·삭제 요청 절차는 적용되지 않습니다.</li>
            <li>진단 결과 페이지의 URL을 삭제하면 해당 결과에 대한 접근이 불가능해집니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            제8조 (방침의 변경)
          </h2>
          <p>
            본 개인정보처리방침은 관련 법령 또는 서비스 정책의 변경에 따라 수정될 수 있으며,
            변경 사항은 서비스 내 공지를 통해 안내합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            제9조 (개인정보 보호책임자)
          </h2>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-6">
            <p className="mb-2 text-sm">
              개인정보 보호 관련 문의사항이 있으시면 아래로 연락해 주시기 바랍니다.
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                이메일:{' '}
                <a href="mailto:privacy@grantmatch.kr" className="font-medium text-primary hover:underline">
                  privacy@grantmatch.kr
                </a>
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              기타 개인정보 침해에 대한 신고나 상담이 필요하신 경우,
              개인정보침해신고센터(privacy.kisa.or.kr), 대검찰청 사이버수사과,
              경찰청 사이버안전국 등으로 문의하실 수 있습니다.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default PrivacyPage
