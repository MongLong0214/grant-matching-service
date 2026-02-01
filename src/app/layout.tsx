import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
