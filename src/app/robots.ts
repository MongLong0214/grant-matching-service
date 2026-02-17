import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/result/'],
      },
      // 네이버 검색봇 (Yeti) — crawlDelay로 서버 부하 방지
      {
        userAgent: 'Yeti',
        allow: '/',
        disallow: ['/api/', '/result/'],
        crawlDelay: 1,
      },
      // 다음 검색봇
      {
        userAgent: 'Daum',
        allow: '/',
        disallow: ['/api/', '/result/'],
      },
    ],
    sitemap: 'https://gogov.co.kr/sitemap.xml',
    host: 'https://gogov.co.kr',
  }
}
