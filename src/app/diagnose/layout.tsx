import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '무료 진단하기',
  description:
    '30초 무료 진단으로 나에게 맞는 정부 혜택을 찾아보세요. 15,000개+ 지원사업 중 조건에 맞는 혜택만 매칭. 회원가입 없이 바로 시작.',
  alternates: {
    canonical: 'https://gogov.co.kr/diagnose',
  },
  openGraph: {
    title: '무료 진단하기 | 혜택찾기',
    description: '30초 무료 진단으로 나에게 맞는 정부 혜택을 찾아보세요. 15,000개+ 지원사업 중 조건에 맞는 혜택만 매칭.',
    url: 'https://gogov.co.kr/diagnose',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: '혜택찾기 무료 진단',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '무료 진단하기 | 혜택찾기',
    description: '30초 무료 진단으로 나에게 맞는 정부 혜택을 찾아보세요.',
    images: ['/opengraph-image'],
  },
}

export default function DiagnoseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '홈',
                item: 'https://gogov.co.kr',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '무료 진단하기',
                item: 'https://gogov.co.kr/diagnose',
              },
            ],
          }),
        }}
      />
      {children}
    </>
  )
}
