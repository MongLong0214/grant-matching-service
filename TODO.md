# Grant Match - TODO List

## 즉시 필요 (배포 후 바로)

### 검색엔진 등록
- [ ] Google Search Console 등록
  - [ ] 사이트 소유권 인증
  - [ ] `src/app/layout.tsx`의 `GOOGLE_VERIFICATION_CODE` 플레이스홀더를 실제 인증 코드로 교체
  - [ ] Sitemap 제출 (`https://grant-matching-service.vercel.app/sitemap.xml`)
  - [ ] 인덱싱 요청

- [ ] Naver Search Console (웹마스터 도구) 등록
  - [ ] 사이트 소유권 인증
  - [ ] `src/app/layout.tsx`의 `NAVER_VERIFICATION_CODE` 플레이스홀더를 실제 인증 코드로 교체
  - [ ] RSS 피드 제출
  - [ ] 사이트 최적화 체크

### 데이터베이스 정리
- [ ] Supabase `diagnoses` 테이블에서 `email` 컬럼 제거
  ```sql
  ALTER TABLE diagnoses DROP COLUMN IF EXISTS email;
  ```
  - 참고: 코드에서는 이미 완전히 제거됨 (커밋 `41d35ab`)
  - DB 스키마만 마이그레이션 필요

### 애널리틱스
- [ ] Google Analytics 4 연동
  - [ ] GA4 속성 생성
  - [ ] 측정 ID 발급
  - [ ] `next.config.ts` 또는 `layout.tsx`에 Google Tag 추가
  - [ ] 전환 이벤트 설정 (진단 완료, CTA 클릭)
  - 참고: 현재 Vercel Analytics만 설정됨

---

## 데이터 파이프라인 운영

### Cron 작업 모니터링
- [ ] Vercel Cron 작동 확인
  - 현재 설정: 매일 3AM UTC (vercel.json)
  - [ ] 첫 실행 후 로그 확인 (Vercel Dashboard)
  - [ ] Supabase `supports` 테이블 데이터 증가 확인
  - [ ] 에러 발생 시 알림 설정

- [ ] GitHub Actions 백업 워크플로우 테스트
  - 파일: `.github/workflows/sync.yml`
  - [ ] 수동 트리거 테스트 (`workflow_dispatch`)
  - [ ] 실패 시 재시도 로직 확인
  - [ ] Secrets 설정 검증 (`SYNC_SECRET`, `APP_URL`)

### API 키 발급 및 연동
- [ ] 기업마당(Bizinfo) API 키 발급
  - [ ] [공공데이터포털](https://www.data.go.kr/) 회원가입
  - [ ] 기업마당 API 신청
  - [ ] `BIZINFO_API_KEY` 환경변수 등록 (Vercel + .env.local)
  - [ ] `/api/sync/bizinfo` 엔드포인트 테스트

- [ ] K-Startup API 키 발급
  - [ ] [K-Startup](https://www.k-startup.go.kr/) API 신청
  - [ ] `KSTARTUP_API_KEY` 환경변수 등록
  - [ ] `/api/sync/kstartup` 엔드포인트 테스트
  - 참고: 현재 mock 데이터로 작동 중

### 크롤러 및 모니터링
- [ ] 복지로(Bokjiro) 크롤러 모니터링 셋업
  - [ ] 크롤링 성공률 추적 (중앙정부 + 지자체)
  - [ ] HTML 구조 변경 감지 알림
  - [ ] 데이터 품질 검증 (필수 필드 누락 체크)

- [ ] 데이터 수집 실패 알림 설정
  - [ ] Slack Webhook 연동 (선택사항)
  - [ ] 이메일 알림 (Resend/SendGrid)
  - [ ] Vercel Log Drains 활용
  - [ ] Sentry 에러 트래킹 (선택사항)

---

## 기능 개선

### 인증 시스템
- [ ] 사용자 인증 시스템 구축
  - [ ] Supabase Auth 연동
  - [ ] 로그인/회원가입 UI (소셜 로그인 포함)
  - [ ] 헤더에 로그인 버튼 추가 (현재 제거됨)
  - [ ] 보호된 라우트 설정

### 진단 결과 관리
- [ ] 진단 결과 저장/히스토리 기능
  - [ ] 로그인한 사용자의 진단 히스토리 저장
  - [ ] 마이페이지에서 과거 진단 결과 조회
  - [ ] 진단 비교 기능 (시간에 따른 매칭률 변화)

### 지원금 상세 페이지
- [ ] `/support/[id]` 페이지 구현
  - [ ] 지원금 상세 정보 표시
  - [ ] 신청 방법 step-by-step 가이드
  - [ ] 필요 서류 체크리스트
  - [ ] 유사 지원금 추천
  - [ ] 댓글/QnA 섹션
  - [ ] 공유하기 버튼

### 지원금 브라우징
- [ ] 지원금 카테고리별 브라우징 페이지
  - [ ] `/supports` 메인 페이지 (전체 목록)
  - [ ] 카테고리 필터 (업종별, 지역별, 유형별)
  - [ ] 검색 기능 (제목, 키워드)
  - [ ] 정렬 기능 (최신순, 마감임박순, 지원금액순)
  - [ ] 페이지네이션 또는 무한 스크롤

### 알림 서비스
- [ ] 이메일 알림 서비스
  - [ ] 새 지원금 매칭 시 알림
  - [ ] 지원금 마감 임박 알림 (D-7, D-3, D-1)
  - [ ] 이메일 구독/수신거부 관리
  - [ ] 알림 템플릿 디자인 (React Email)

### 북마크 및 가이드
- [ ] 지원금 즐겨찾기/북마크 기능
  - [ ] 북마크 추가/제거
  - [ ] 마이페이지에서 북마크 목록 조회
  - [ ] 북마크한 지원금 상태 변화 알림

- [ ] 지원금 신청 가이드
  - [ ] Step-by-step 신청 프로세스
  - [ ] 필요 서류 준비 체크리스트
  - [ ] 작성 예시 및 팁
  - [ ] 자주 묻는 질문 (FAQ)

---

## SEO 추가 최적화

### 검색 결과 최적화
- [ ] Google Rich Results 테스트 통과 확인
  - [ ] [Rich Results Test](https://search.google.com/test/rich-results) 사용
  - [ ] 모든 JSON-LD 검증 (Organization, WebApplication, WebSite)
  - [ ] 경고 및 에러 수정

### 백링크 및 콘텐츠 마케팅
- [ ] 네이버 블로그/카페 백링크 전략
  - [ ] 지원금 관련 블로그 글 작성 (10개 이상)
  - [ ] 커뮤니티 참여 (소상공인, 창업 관련 카페)
  - [ ] 인플루언서 협업

- [ ] 콘텐츠 마케팅: 지원금 관련 블로그 글
  - [ ] `/blog` 라우트 생성 (Static Generation)
  - [ ] SEO 최적화된 블로그 글 10편 이상 작성
  - [ ] 예시 주제: "2025년 소상공인 필수 지원금 TOP 10", "창업 지원금 신청 가이드"
  - [ ] 블로그 포스트별 OG 이미지 동적 생성

### 구조화 데이터 확장
- [ ] 페이지별 구조화 데이터 추가
  - [ ] `BreadcrumbList` 스키마 (네비게이션 경로)
  - [ ] `FAQPage` 스키마 (FAQ 섹션에 추가)
  - [ ] `HowTo` 스키마 (지원금 신청 가이드)
  - [ ] `Review` 스키마 (사용자 후기 섹션)

### 네이버 SEO
- [ ] 네이버 지식스니펫 최적화
  - [ ] 질문-답변 형식 콘텐츠 추가
  - [ ] 표, 리스트 형식 활용
  - [ ] 핵심 키워드 밀도 최적화

---

## 성능 최적화

### Lighthouse 100점 달성
- [ ] Lighthouse 100점 달성 확인
  - [x] Performance: 100 (CLS 0 달성)
  - [ ] Accessibility: 100 검증
  - [ ] Best Practices: 100 검증
  - [ ] SEO: 100 검증
  - [ ] PWA: 100 검증 (manifest.ts 설정됨)

### 이미지 최적화
- [ ] 이미지 최적화
  - [ ] `next/image` 컴포넌트 활용 (현재 이미지 없음)
  - [ ] WebP/AVIF 포맷 사용
  - [ ] 이미지 CDN 연동 (Cloudinary/Imgix)
  - [ ] Lazy loading 적용

### 런타임 최적화
- [ ] Edge Runtime 전환 검토
  - [ ] API Routes에 `export const runtime = 'edge'` 추가
  - [ ] Supabase Edge Functions 활용 가능성 검토
  - [ ] 레이턴시 개선 측정

- [ ] ISR(Incremental Static Regeneration) 적용 검토
  - [ ] 지원금 목록 페이지에 `revalidate` 설정
  - [ ] On-Demand Revalidation (데이터 업데이트 시)
  - [ ] 캐시 전략 최적화

---

## 법적/운영

### 법적 문서
- [ ] 이용약관 페이지 작성
  - [ ] `/terms` 라우트 생성
  - [ ] 법률 자문 검토 (선택사항)
  - [ ] 최종 업데이트 날짜 표시
  - [ ] Footer에 링크 추가

- [ ] 개인정보처리방침 페이지 작성
  - [ ] `/privacy` 라우트 생성
  - [ ] 수집하는 정보 명시 (쿠키, 진단 데이터)
  - [ ] 법률 자문 검토
  - [ ] Footer에 링크 추가

### 고객 지원
- [ ] 고객센터/문의 기능
  - [ ] `/contact` 페이지 생성
  - [ ] 문의 폼 (Supabase 저장 또는 이메일 전송)
  - [ ] FAQ 확장
  - [ ] 채팅 위젯 검토 (Intercom/Tawk.to)

### 모니터링 대시보드
- [ ] 서비스 모니터링 대시보드
  - [ ] Vercel Analytics 대시보드 활용
  - [ ] 커스텀 대시보드 구축 (선택사항)
  - [ ] 주요 메트릭 추적:
    - 일일 진단 수
    - 평균 매칭 지원금 수
    - 페이지별 트래픽
    - 사용자 전환율
    - API 응답 시간
    - 에러 발생률

---

## 디자인

### 다크모드
- [ ] 다크모드 지원
  - CSS 변수는 이미 설정됨 (`globals.css`)
  - [ ] `next-themes` 패키지 설치
  - [ ] 테마 토글 버튼 추가 (헤더)
  - [ ] 다크모드 디자인 QA (모든 페이지)
  - [ ] 사용자 선호도 저장 (localStorage)

### PWA 최적화
- [ ] 모바일 앱 느낌 PWA 최적화
  - `manifest.ts` 설정됨
  - [ ] 오프라인 지원 (Service Worker)
  - [ ] 설치 프롬프트 (Install App)
  - [ ] 푸시 알림 (선택사항)
  - [ ] 앱 아이콘 최적화 (모든 사이즈)

### UI/UX 개선
- [ ] 로딩 스켈레톤 UI
  - [ ] 진단 폼 로딩 스켈레톤
  - [ ] 결과 페이지 로딩 스켈레톤
  - [ ] 지원금 카드 스켈레톤
  - Suspense 경계 설정

- [ ] 에러 페이지 디자인
  - [ ] 404 페이지 (`not-found.tsx`)
  - [ ] 500 페이지 (`error.tsx`)
  - [ ] 에러 일러스트레이션
  - [ ] 홈으로 돌아가기 버튼

- [ ] 진단 결과 페이지 애니메이션/인터랙션 강화
  - [ ] 매칭 점수 카운트업 애니메이션
  - [ ] 지원금 카드 Hover 효과 강화
  - [ ] 스크롤 애니메이션 (Framer Motion)
  - [ ] 공유하기 모달
  - [ ] PDF 다운로드 기능

---

## 우선순위 요약

### P0 (즉시 필요)
1. Google/Naver 검색엔진 등록 + 인증 코드 교체
2. Supabase `email` 컬럼 제거
3. Vercel Cron 작동 확인

### P1 (1주 내)
1. Google Analytics 4 연동
2. 데이터 수집 실패 알림 설정
3. 이용약관/개인정보처리방침 작성

### P2 (1개월 내)
1. 사용자 인증 시스템
2. 지원금 상세 페이지
3. 지원금 브라우징 페이지
4. 이메일 알림 서비스

### P3 (2개월 내)
1. 다크모드 지원
2. 콘텐츠 마케팅 (블로그)
3. 성능 최적화 (Edge Runtime, ISR)
4. PWA 오프라인 지원

---

**마지막 업데이트**: 2026-02-05
**작성자**: Claude Sonnet 4.5
