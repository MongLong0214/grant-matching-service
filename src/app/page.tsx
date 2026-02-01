import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * 랜딩 페이지
 *
 * 서비스 소개 + 무료 진단 시작 CTA
 * 3초 안에 서비스 이해 + 진단 시작 유도
 */
export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 via-white to-white" />

        <div className="mx-auto max-w-2xl space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            30초면 끝 · 가입 없음
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            받을 수 있는 지원금,
            <br />
            <span className="text-blue-600">몇 개나 놓치고</span> 계세요?
          </h1>

          {/* Sub-text */}
          <p className="mx-auto max-w-lg text-base text-slate-600 sm:text-lg">
            사업 정보 5개만 입력하면
            <br className="sm:hidden" />
            {' '}받을 수 있는 정부지원금을 바로 찾아드려요.
          </p>

          {/* CTA Button */}
          <div className="pt-4">
            <Link href="/diagnose">
              <Button size="lg" className="h-14 px-8 text-base font-semibold shadow-lg shadow-blue-500/25 sm:text-lg">
                무료 진단 시작
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">평균 7개</p>
              <p className="mt-1 text-sm text-slate-600">지원금 발견</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">2,300만원</p>
              <p className="mt-1 text-sm text-slate-600">평균 지원 기회</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">10,000+</p>
              <p className="mt-1 text-sm text-slate-600">사장님 이용</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            이렇게 간단해요
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                1
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">사업 정보 입력</h3>
              <p className="mt-2 text-sm text-slate-600">
                업종, 지역, 직원 수 등<br />5개 정보만 선택하세요
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                2
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">자동 매칭</h3>
              <p className="mt-2 text-sm text-slate-600">
                조건에 맞는 지원금을<br />자동으로 찾아드려요
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                3
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">바로 신청</h3>
              <p className="mt-2 text-sm text-slate-600">
                매칭된 지원금의<br />신청 페이지로 바로 이동
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-lg font-medium text-slate-700">
            놓치고 있는 지원금, 지금 바로 확인하세요
          </p>
          <div className="mt-4">
            <Link href="/diagnose">
              <Button size="lg">무료 진단 시작</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
