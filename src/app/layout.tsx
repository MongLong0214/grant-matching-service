import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Wallet } from 'lucide-react'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const notoSansKR = Noto_Sans_KR({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
})

export const metadata: Metadata = {
  title: '지원금 찾기 - 정부지원금 자동 매칭',
  description: '소상공인 사업 정보 입력하면 받을 수 있는 정부지원금을 자동으로 매칭해주는 서비스. 30초면 끝, 가입 없음.',
  openGraph: {
    title: '지원금 찾기 - 정부지원금 자동 매칭',
    description: '30초 만에 받을 수 있는 정부지원금을 찾아보세요.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} ${notoSansKR.variable} antialiased bg-background text-foreground flex min-h-screen flex-col`}>
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Grant Match</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-3 md:gap-6">
              <span className="hidden md:inline-flex cursor-not-allowed text-sm text-muted-foreground">
                서비스 소개
              </span>
              <Link href="/diagnose" className="text-sm md:text-base font-medium hover:text-primary">
                진단하기
              </Link>
              <button className="rounded-xl bg-primary/10 px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base font-medium text-primary hover:bg-primary/20">
                로그인
              </button>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="w-full border-t bg-white py-10">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="flex flex-col gap-6 text-center md:flex-row md:items-start md:justify-between md:text-left">
              {/* Logo */}
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="font-bold">Grant Match</span>
              </div>

              {/* Links */}
              <div className="flex justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
                <Link href="#" className="hover:text-foreground">
                  이용약관
                </Link>
                <Link href="#" className="hover:text-foreground">
                  개인정보처리방침
                </Link>
                <Link href="#" className="hover:text-foreground">
                  고객센터
                </Link>
              </div>

              {/* Copyright */}
              <p className="text-sm text-muted-foreground">
                © 2025 Grant Match. All rights reserved.
              </p>
            </div>

            {/* Disclaimer */}
            <p className="mt-6 text-xs md:text-xs text-gray-400">
              본 서비스는 정부지원금 정보를 제공하는 서비스이며, 실제 지원금 신청 및 승인은 각 사업 담당 기관의 심사를 거쳐 결정됩니다.
              제공되는 정보는 참고용이며, 실제 지원 가능 여부는 담당 기관에 문의하시기 바랍니다.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
