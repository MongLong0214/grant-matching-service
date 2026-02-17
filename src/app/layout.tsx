import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

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
  metadataBase: new URL('https://gogov.co.kr'),
  title: {
    default: '혜택찾기 | 나에게 맞는 정부 혜택 찾기',
    template: '%s | 혜택찾기',
  },
  description:
    '간단한 정보만 입력하면 6,000개 이상의 정부 지원사업 중 나에게 맞는 혜택을 30초 만에 무료로 찾아드립니다. 개인 복지부터 소상공인 지원금까지 맞춤 매칭.',
  keywords: [
    '정부혜택',
    '지원금',
    '보조금',
    '복지',
    '소상공인',
    '청년',
    '정부지원금',
    '소상공인 지원금',
    '청년 혜택',
    '주거 지원',
    '육아 지원',
    '교육 지원',
    '취업 지원',
    '창업 지원금',
    '정부 보조금',
    '혜택 찾기',
    '지원금 매칭',
    '보조금 신청',
    '복지 혜택',
    '정부 혜택 조회',
  ],
  authors: [{ name: '혜택찾기' }],
  creator: '혜택찾기',
  publisher: '혜택찾기',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://gogov.co.kr',
    siteName: '혜택찾기',
    title: '혜택찾기 | 나에게 맞는 정부 혜택 찾기',
    description:
      '6,000개 이상의 정부 지원사업 중 나에게 맞는 혜택을 30초 만에 무료로 찾아드립니다. 개인 복지부터 소상공인 지원금까지.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '혜택찾기 | 나에게 맞는 정부 혜택 찾기',
    description:
      '30초 만에 받을 수 있는 정부 혜택을 무료로 찾아보세요. 회원가입 없이 바로 조회.',
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
    canonical: 'https://gogov.co.kr',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} ${notoSansKR.variable} antialiased bg-background text-foreground flex min-h-screen flex-col`}>
        <a href="#main-content" className="skip-to-content">
          본문으로 건너뛰기
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  name: '혜택찾기',
                  url: 'https://gogov.co.kr',
                  logo: 'https://gogov.co.kr/icon',
                  description: '전국민 정부 혜택 매칭 서비스',
                },
                {
                  '@type': 'WebApplication',
                  name: '혜택찾기',
                  url: 'https://gogov.co.kr',
                  applicationCategory: 'GovernmentService',
                  operatingSystem: 'Web',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'KRW',
                  },
                  description:
                    '6,000개 이상의 정부 지원사업 중 나에게 맞는 혜택을 30초 만에 무료로 찾아드립니다.',
                  inLanguage: 'ko',
                },
                {
                  '@type': 'WebSite',
                  name: '혜택찾기',
                  url: 'https://gogov.co.kr',
                  inLanguage: 'ko',
                },
                {
                  '@type': 'FAQPage',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: '정말 무료인가요?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: '네, 혜택찾기의 모든 진단 서비스는 100% 무료입니다. 숨겨진 비용이나 추가 결제는 일절 없으며, 회원가입 없이도 바로 이용하실 수 있습니다.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: '개인과 사업자 중 어떤 걸 선택해야 하나요?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: '주거/육아/교육/건강 등 생활 복지 혜택을 찾으신다면 개인을, 창업/고용/수출/R&D 등 사업 관련 지원금을 찾으신다면 사업자를 선택하세요. 두 가지 모두 진단받으실 수도 있습니다.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: '어떤 혜택을 찾아주나요?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: '복지로, 보조금24, 중소벤처기업부 등의 데이터를 연동하여 6,000개 이상의 정부 지원사업을 분석합니다. 개인 복지부터 사업자 지원금까지 폭넓게 다룹니다.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: '입력한 정보는 안전한가요?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: '입력하신 정보는 혜택 매칭 분석에만 사용되며, 분석 완료 후 즉시 폐기됩니다. 별도의 데이터 저장이나 제3자 제공은 일절 하지 않습니다.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: '진단 결과가 나온 후 어떻게 신청하나요?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: '진단 결과에서 각 혜택의 상세 정보와 함께 신청 방법, 담당기관 연락처를 제공합니다. 해당 기관의 공식 채널을 통해 직접 신청하실 수 있습니다.',
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
        <Header />

        <main id="main-content" className="flex-1">{children}</main>
        <Analytics />
        <SpeedInsights />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}

        <Footer />
      </body>
    </html>
  )
}
