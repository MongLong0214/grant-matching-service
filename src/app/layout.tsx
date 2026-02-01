import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Sans_KR } from 'next/font/google'
import './globals.css'

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
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <a href="/" className="text-lg font-bold text-foreground">
              지원금 매칭
            </a>
            <nav className="flex items-center gap-4">
              <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">홈</a>
              <a href="/diagnose" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">진단하기</a>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-border bg-muted/50">
          <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm font-medium text-foreground">지원금 매칭</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                본 서비스에서 제공하는 지원금 정보는 참고용이며, 실제 지원 조건 및 세부사항은 해당 기관의 공식 공고를 반드시 확인해주세요.
              </p>
              <p className="text-xs text-muted-foreground/70">© 2026 지원금 매칭. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
