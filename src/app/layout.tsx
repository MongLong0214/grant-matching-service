import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
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
  display: 'optional',
  variable: '--font-noto-sans-kr',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL('https://grant-matching-service.vercel.app'),
  title: {
    default: 'Grant Match - 정부지원금 자동 매칭 | 30초 무료 진단',
    template: '%s | Grant Match',
  },
  description:
    '사업 정보만 입력하면 95,000개 이상의 정부지원금 중 받을 수 있는 지원금을 30초 만에 무료로 찾아드립니다. 소상공인, 중소기업, 창업자를 위한 맞춤 지원금 매칭 서비스.',
  keywords: [
    '정부지원금',
    '소상공인 지원금',
    '중소기업 지원금',
    '창업 지원금',
    '정부 보조금',
    '사업자 지원금',
    '지원금 찾기',
    '지원금 매칭',
    '소상공인시장진흥공단',
    '중소벤처기업부',
    '고용지원금',
    '수출지원금',
    'R&D 지원금',
    '정부지원사업',
    '보조금 신청',
    '지원금 자격',
  ],
  authors: [{ name: 'Grant Match' }],
  creator: 'Grant Match',
  publisher: 'Grant Match',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://grant-matching-service.vercel.app',
    siteName: 'Grant Match',
    title: 'Grant Match - 정부지원금 자동 매칭 | 30초 무료 진단',
    description:
      '사업 정보만 입력하면 95,000개 이상의 정부지원금 중 받을 수 있는 지원금을 30초 만에 무료로 찾아드립니다.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grant Match - 정부지원금 자동 매칭',
    description:
      '30초 만에 받을 수 있는 정부지원금을 무료로 찾아보세요.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://grant-matching-service.vercel.app',
  },
  verification: {
    google: 'GOOGLE_VERIFICATION_CODE',
    other: {
      'naver-site-verification': 'NAVER_VERIFICATION_CODE',
    },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  name: 'Grant Match',
                  url: 'https://grant-matching-service.vercel.app',
                  logo: 'https://grant-matching-service.vercel.app/icon-512.png',
                  description: '정부지원금 자동 매칭 서비스',
                },
                {
                  '@type': 'WebApplication',
                  name: 'Grant Match',
                  url: 'https://grant-matching-service.vercel.app',
                  applicationCategory: 'FinanceApplication',
                  operatingSystem: 'Web',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'KRW',
                  },
                  description:
                    '사업 정보만 입력하면 95,000개 이상의 정부지원금 중 받을 수 있는 지원금을 30초 만에 무료로 찾아드립니다.',
                  inLanguage: 'ko',
                },
                {
                  '@type': 'WebSite',
                  name: 'Grant Match',
                  url: 'https://grant-matching-service.vercel.app',
                  inLanguage: 'ko',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target:
                      'https://grant-matching-service.vercel.app/diagnose',
                    'query-input':
                      'required name=search_term_string',
                  },
                },
              ],
            }),
          }}
        />
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Grant Match</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center">
              <Link href="/diagnose" className="text-sm md:text-base font-medium hover:text-primary">
                진단하기
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
        <Analytics />
        <SpeedInsights />

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
