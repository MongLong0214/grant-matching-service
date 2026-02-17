import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '무료 진단하기',
  description:
    '간단한 정보만 입력하면 6,000개 이상의 정부 지원사업 중 나에게 맞는 혜택을 30초 만에 무료로 찾아드립니다.',
}

export default function DiagnoseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
