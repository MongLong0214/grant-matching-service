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
    '15,000개+ 정부 지원사업 중 나에게 맞는 혜택을 30초 만에 무료 매칭. 회원가입 없이 개인 복지·소상공인 지원금·창업 보조금까지 즉시 조회.',
  keywords: [
    // 핵심 키워드
    '정부혜택', '지원금', '보조금', '복지', '정부지원금', '혜택 찾기', '지원금 매칭', '정부 혜택 조회',
    // 대상별 키워드
    '청년 지원금', '청년 혜택', '신혼부부 혜택', '한부모가정 지원', '장애인 복지', '어르신 혜택',
    '다문화가정 지원', '임산부 혜택', '대학생 지원금', '소상공인', '소상공인 지원금',
    // 분야별 키워드
    '주거 지원', '의료비 지원', '학자금 대출', '고용 지원', '육아 지원', '교육 지원',
    '취업 지원', '창업 지원금', 'R&D 지원금', '수출 지원', '기술개발 자금', '사업자 보조금',
    // 지역별 키워드
    '서울 지원금', '경기도 보조금', '부산 지원사업', '인천 지원금', '대구 지원금', '대전 지원금',
    '광주 지원금', '울산 지원금', '세종 지원금', '강원 지원사업', '충청 지원금', '전라 지원금',
    '경상 지원금', '제주 지원사업',
    // 행동 키워드
    '정부 지원금 신청방법', '보조금 자격 확인', '복지 혜택', '정부 보조금', '보조금 신청',
    '지원금 조회', '혜택 조회', '무료 진단', '30초 진단',
  ],
  authors: [{ name: '혜택찾기' }],
  creator: '혜택찾기',
  publisher: '혜택찾기',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // 검색엔진 인증 태그 (환경변수 기반)
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ?? '',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://gogov.co.kr',
    siteName: '혜택찾기',
    title: '혜택찾기 | 나에게 맞는 정부 혜택 찾기',
    description:
      '15,000개+ 정부 지원사업 중 나에게 맞는 혜택을 30초 만에 무료 매칭. 회원가입 없이 개인 복지·소상공인 지원금까지.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: '혜택찾기 - 나에게 맞는 정부 혜택 찾기',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '혜택찾기 | 나에게 맞는 정부 혜택 찾기',
    description:
      '15,000개+ 정부 혜택 중 나에게 맞는 것만. 30초 무료 진단, 회원가입 불필요.',
    images: ['/opengraph-image'],
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
                  '@id': 'https://gogov.co.kr/#organization',
                  name: '혜택찾기',
                  url: 'https://gogov.co.kr',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://gogov.co.kr/icon',
                  },
                  description: '전국민 정부 혜택 매칭 서비스',
                  contactPoint: {
                    '@type': 'ContactPoint',
                    email: 'support@gogov.co.kr',
                    contactType: 'customer support',
                    availableLanguage: '한국어',
                  },
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://gogov.co.kr/#website',
                  name: '혜택찾기',
                  url: 'https://gogov.co.kr',
                  inLanguage: 'ko',
                  publisher: { '@id': 'https://gogov.co.kr/#organization' },
                  // Sitelinks Search Box 유도
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://gogov.co.kr/diagnose',
                    'query-input': 'required name=search_term_string',
                  },
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
                    '15,000개 이상의 정부 지원사업 중 나에게 맞는 혜택을 30초 만에 무료로 찾아드립니다.',
                  inLanguage: 'ko',
                },
                {
                  '@type': 'GovernmentService',
                  name: '혜택찾기 정부 혜택 매칭 서비스',
                  url: 'https://gogov.co.kr',
                  description: '15,000개 이상의 정부 지원사업 데이터를 기반으로 개인 및 소상공인에게 맞춤형 혜택을 매칭하는 무료 서비스입니다.',
                  provider: { '@id': 'https://gogov.co.kr/#organization' },
                  serviceType: '정부 혜택 매칭',
                  areaServed: {
                    '@type': 'Country',
                    name: '대한민국',
                  },
                },
                {
                  '@type': 'HowTo',
                  name: '혜택찾기 사용 방법',
                  description: '3단계로 나에게 맞는 정부 혜택을 찾아보세요.',
                  totalTime: 'PT30S',
                  step: [
                    {
                      '@type': 'HowToStep',
                      position: 1,
                      name: '유형 선택',
                      text: '개인(복지 혜택) 또는 사업자(지원금) 중 원하는 진단 유형을 선택합니다.',
                    },
                    {
                      '@type': 'HowToStep',
                      position: 2,
                      name: '정보 입력',
                      text: '지역, 연령대, 소득 수준 등 간단한 정보를 입력합니다. 회원가입 불필요.',
                    },
                    {
                      '@type': 'HowToStep',
                      position: 3,
                      name: '결과 확인',
                      text: '30초 만에 나에게 맞는 정부 혜택 목록과 신청 방법을 확인합니다.',
                    },
                  ],
                },
                {
                  '@type': 'BreadcrumbList',
                  itemListElement: [
                    {
                      '@type': 'ListItem',
                      position: 1,
                      name: '홈',
                      item: 'https://gogov.co.kr',
                    },
                  ],
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
                        text: '복지로, 보조금24, 중소벤처기업부 등의 데이터를 연동하여 15,000개 이상의 정부 지원사업을 분석합니다. 개인 복지부터 사업자 지원금까지 폭넓게 다룹니다.',
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
