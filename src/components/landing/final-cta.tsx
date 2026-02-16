import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  RefreshCw,
  Building2,
  User,
} from 'lucide-react'

export const FinalCta = () => {
  return (
    <section aria-label="무료 진단 시작" className="px-4 pb-20 sm:pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-primary to-teal-600 px-8 py-16 text-center shadow-2xl shadow-primary/20 sm:px-16 sm:py-20">
          {/* 장식 요소 */}
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/[0.06]" role="img" aria-hidden="true" />
          <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-white/[0.04]" role="img" aria-hidden="true" />
          <div className="absolute left-1/3 top-0 h-32 w-32 rounded-full bg-white/[0.03]" role="img" aria-hidden="true" />

          {/* 도트 패턴 오버레이 */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            role="img"
            aria-hidden="true"
            style={{
              backgroundImage:
                'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative">
            {/* 긴급 배지 */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              매일 새로운 혜택 업데이트
            </div>

            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              지금 바로 무료 진단을
              <br />
              시작하세요
            </h2>
            <p className="mb-10 text-lg text-white/80 sm:text-xl">
              30초면 놓치고 있던 정부 혜택을 찾을 수 있습니다
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="h-13 w-full rounded-xl bg-white px-8 text-base font-semibold text-emerald-700 shadow-lg transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-white/95 hover:shadow-xl sm:w-auto sm:text-lg"
              >
                <Link href="/diagnose?type=personal" className="inline-flex items-center gap-2">
                  <User className="h-5 w-5" aria-hidden="true" />
                  개인 혜택 찾기
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-13 w-full rounded-xl border-2 border-white/30 bg-white/10 px-8 text-base font-semibold text-white shadow-lg backdrop-blur-sm transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-xl sm:w-auto sm:text-lg"
              >
                <Link href="/diagnose?type=business" className="inline-flex items-center gap-2">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                  사업자 지원금 찾기
                </Link>
              </Button>
            </div>

            {/* 하단 신뢰 지표 */}
            <p className="mt-6 text-sm text-white/60">
              회원가입 불필요 -- 30초 만에 결과 확인
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
