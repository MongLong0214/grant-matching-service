import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '혜택찾기 - 나에게 맞는 정부 혜택 찾기',
    short_name: '혜택찾기',
    description:
      '15,000개 이상의 정부 지원사업 중 나에게 맞는 혜택을 30초 만에 무료로 찾아드립니다',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
      // PWA 표준 아이콘 크기 추가 — Android 홈화면 등재 및 검색 결과 표시 개선
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
