import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Grant Match - 정부지원금 자동 매칭'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            G
          </div>
          <span
            style={{ fontSize: 40, fontWeight: 700, color: '#1f2937' }}
          >
            Grant Match
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#111827',
            textAlign: 'center',
            lineHeight: 1.3,
            marginBottom: 20,
          }}
        >
          사업자를 위한 정부지원금,
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            background: 'linear-gradient(90deg, #10b981, #059669)',
            backgroundClip: 'text',
            color: 'transparent',
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          30초면 찾아드립니다
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: '#6b7280',
            marginTop: 32,
            textAlign: 'center',
          }}
        >
          95,000개 이상의 지원사업 데이터 · 무료 · 회원가입 불필요
        </div>
      </div>
    ),
    { ...size }
  )
}
