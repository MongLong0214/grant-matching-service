import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gogov.co.kr'
  // OG 이미지 URL — Google Image Search 등재 유도
  const ogImage = `${baseUrl}/opengraph-image`

  return [
    {
      url: baseUrl,
      lastModified: new Date('2026-02-17'),
      changeFrequency: 'daily',
      priority: 1,
      images: [ogImage],
    },
    {
      url: `${baseUrl}/diagnose`,
      lastModified: new Date('2026-02-17'),
      changeFrequency: 'weekly',
      priority: 0.9,
      images: [ogImage],
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-02-17'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-02-17'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
