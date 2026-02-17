# 한국 공공데이터 수집 소스 전수조사 및 개선 권고안

> 조사일: 2026-02-16
> 프로젝트: grant-matching-service (정부지원금 매칭 서비스)

---

## 1. 현재 소스 상태 테이블

### 1.1 활성 동작 중인 소스 (4개)

| 소스 | API 엔드포인트 | API 키 | 레코드 수 | 데이터 형식 | 추출 정확도 | 문제점 |
|------|---------------|--------|----------|------------|-----------|--------|
| **Bokjiro Central** | `apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist` | `BIZINFO_API_KEY` | ~900 | XML | 중 (텍스트 기반 추출) | 일 API 호출 100건 제한으로 전수 수집에 10일 소요. `numOfRows=10` 고정. service_type 판정이 키워드 기반으로 부정확 |
| **Bokjiro Local** | `apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfaredetailed` | `BIZINFO_API_KEY` | ~900 | XML | 중-상 (ctpvNm 구조화 지역) | Central과 동일한 API 제한. 지역 매핑은 ctpvNm 필드 덕분에 상대적으로 정확 |
| **Subsidy24** | `api.odcloud.kr/api/gov24/v3/serviceList` | `SUBSIDY24_API_KEY` | ~5,000 | JSON (odcloud v3) | 중 | 선정기준/서비스목적요약 텍스트에서만 추출. 개인/법인 구분이 `사용자구분` 필드로 가능하나 세부 타겟팅 부족 |
| **MSIT R&D** | `apis.data.go.kr/1721000/msitannouncementinfo/businessAnnouncMentList` | `MSIT_RND_API_KEY` | ~500 | XML (type=json 무시) | 하 | 제목(subject)만으로 추출하므로 정확도 극히 낮음. 별도 ID 필드 없어 제목+날짜 해시로 대체. User-Agent 필수 |

### 1.2 구현되어 있으나 비활성/실패 소스 (5개)

| 소스 | API 엔드포인트 | 상태 | 레코드 수 | 문제점 |
|------|---------------|------|----------|--------|
| **K-Startup** | `apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01` | 403 | 0 | data.go.kr API 키 전파 문제. 별도 활용신청이 필요한 것으로 추정 |
| **Bizinfo RSS** | `bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/rssFeed.do` | 404 | 0 | URL 변경됨. 새로운 crtfcKey 기반 API(`bizinfo.go.kr/uss/rss/bizinfoApi.do`)로 마이그레이션 필요 |
| **KOCCA** | (미구현 - LINK 유형) | Stub | 0 | "LINK 유형 API - REST 엔드포인트 미제공" 로그만 출력. data.go.kr에 `15134251` API가 실제 존재함 |
| **SME Venture24** | (미구현 - LINK 유형) | Stub | 0 | "LINK 유형 API - REST 엔드포인트 미제공" 로그만 출력. `smes.go.kr/main/dbCnrs`에 Open API 존재 |
| **Youth Policy** | (미구현 - LINK 유형) | Stub | 0 | "LINK 유형 API - REST 엔드포인트 미제공" 로그만 출력. `data.go.kr/data/15143273` 및 `youthcenter.go.kr` API 존재 |

### 1.3 별도 경로로 동기화되는 소스 (1개)

| 소스 | API 엔드포인트 | 상태 | 레코드 수 | 비고 |
|------|---------------|------|----------|------|
| **Bizinfo odcloud** | `api.odcloud.kr/api/3034791/v1/uddi:...` (2024/2025) | 별도 `/api/sync` 라우트 | ~95,000 | `src/lib/bizinfo.ts`에 구현. 대규모 데이터셋이나 추출 정확도가 사업명 기반이라 낮음 |

### 1.4 현재 합계

| 메트릭 | 값 |
|--------|---|
| **총 구현된 fetcher** | 9개 (+1 bizinfo odcloud) |
| **실제 동작 중** | 4개 (+ bizinfo odcloud 별도) |
| **Stub/실패** | 5개 |
| **DB 예상 레코드** | ~6,400 (활성) + ~95,000 (bizinfo odcloud) |
| **고유 API 키** | 3개 (BIZINFO_API_KEY, SUBSIDY24_API_KEY, MSIT_RND_API_KEY) |

---

## 2. 미수집 소스 (우선순위별)

### Tier 1: 즉시 통합 가능 (API 존재, 데이터 풍부)

| # | 소스 | API URL / 데이터셋 ID | API 유형 | 예상 레코드 | 커버리지 임팩트 | 통합 난이도 | 비고 |
|---|------|----------------------|----------|------------|---------------|-----------|------|
| 1 | **보조금24 (정부24 공공서비스)** | `data.go.kr/data/15113968` | REST (JSON/XML) | 10,000+ | **최상** | 낮음 | 중앙부처+지자체+공공기관+교육청 수혜서비스 통합. Swagger UI 제공. 현재 Subsidy24와 중복 가능성 있으나 커버리지 더 넓음 |
| 2 | **기업마당 지원사업정보 API** | `bizinfo.go.kr/uss/rss/bizinfoApi.do` | REST (XML/JSON) | 3,000~5,000/년 | **상** | 낮음 | crtfcKey 발급 필요. 현재 bizinfo-rss 404 문제의 대체 소스. 분야 8종(금융/기술/인력/수출/내수/창업/경영/기타) 분류 |
| 3 | **중소벤처24 공고정보** | `data.go.kr/data/15113191` | REST | 500~1,000 | **중-상** | 낮음 | 공고명, 기간, 지원기관, 신청상태, 첨부파일. 현재 stub 상태인 sme-venture24 대체 |
| 4 | **KOCCA 지원사업공고** | `data.go.kr/data/15134251` | REST | 100~300/년 | **중** | 낮음 | 콘텐츠 분야 지원사업. 현재 stub 상태 대체 가능. data.go.kr에 실제 API 존재 확인 |
| 5 | **K-Startup 조회서비스 (신규)** | `data.go.kr/data/15125364` | REST | 200~500/년 | **중** | 낮음 | 기존 B552735 API와 별개. 사업소개/사업공고/콘텐츠 통합 조회. 창업진흥원 제공 |
| 6 | **중소벤처기업부 사업공고** | `data.go.kr/data/15113297` | REST | 200~500/년 | **중** | 낮음 | 사업공고 제목, 작성자, 첨부파일 |

### Tier 2: 중기 통합 (별도 API 키 발급 또는 데이터 변환 필요)

| # | 소스 | API URL / 데이터셋 ID | API 유형 | 예상 레코드 | 커버리지 임팩트 | 통합 난이도 | 비고 |
|---|------|----------------------|----------|------------|---------------|-----------|------|
| 7 | **온통청년 청년정책 API** | `data.go.kr/data/15143273` / `youthcenter.go.kr` | REST (XML) | 500~1,000 | **상** (청년 타겟) | 중 | 온통청년 회원가입 + 인증키 발급 필요. 정책명, 키워드, 법정행정구역코드 파라미터. 현재 stub 대체 |
| 8 | **직업훈련 내일배움카드 과정** | `data.go.kr/data/15109032` | REST | 5,000+ | **상** (교육/훈련) | 중 | 훈련과정명, 훈련비, 자비부담, 훈련기관 등. 매칭 차원 확장 필요 (직종/훈련유형) |
| 9 | **NTIS 국가R&D 과제검색** | `data.go.kr/data/15077315` / `ntis.go.kr/rndopen/api` | REST | 10,000+ | **중** (R&D 특화) | 중 | 국가R&D 과제 메타정보. 현재 MSIT R&D보다 훨씬 풍부한 데이터. 전문기관 계정 필요할 수 있음 |
| 10 | **워크넷 채용정보** | `data.go.kr/data/3038225` / `work24.go.kr` API | REST (XML) | 50,000+ | **중** (고용 연계) | 중 | 채용정보는 직접적 지원금이 아니나, 고용 관련 지원사업 연계 가능. 워크넷 Open API 별도 인증키 필요 |
| 11 | **고용행정통계** | `eis.work24.go.kr` | REST (XML) | 통계 데이터 | **낮음** | 중 | 사업장 규모별/학력별/임금별 구인구직 실적. 직접 지원금은 아니나 부가 분석에 유용 |
| 12 | **소상공인시장진흥공단 상가정보** | `data.go.kr/data/15012005` | REST | 2,000,000+ | **낮음** (간접) | 중 | 상권분석 부가서비스에 활용 가능. 지원금 직접 관련은 아님 |

### Tier 3: 장기 검토 (스크래핑 또는 복잡한 데이터 형식)

| # | 소스 | URL | API 가용성 | 예상 레코드 | 커버리지 임팩트 | 통합 난이도 | 비고 |
|---|------|-----|----------|------------|---------------|-----------|------|
| 13 | **소상공인24** | `sbiz24.kr` | API 미확인 (웹 서비스) | 미상 | **상** (소상공인 특화) | 높음 | 소상공인시장진흥공단의 원스톱 정책지원 플랫폼. REST API 공개 여부 미확인. 스크래핑 필요 가능성 |
| 14 | **신용보증기금 (KODIT)** | `kodit.co.kr` | API 미확인 | 50~100 | **중** (금융 보증) | 높음 | 보증 상품 정보. REST API 미공개. 상품 수가 적어 수동 입력 또는 스크래핑 |
| 15 | **기술보증기금 (KIBO)** | `kibo.or.kr` | API 미확인 | 50~100 | **중** (기술 보증) | 높음 | 기술보증 상품 정보. 신용보증기금과 유사한 상황 |
| 16 | **주택도시기금** | `enhuf.molit.go.kr` | `data.go.kr/data/15134235` (파일) | 30~50 상품 | **중** (주거) | 중 | 기금e든든 상품기본정보 파일데이터. 상품 수 적음. API 전환 가능 |
| 17 | **한국장학재단** | `kosaf.go.kr` | 파일데이터만 (API 없음) | 300~500 | **중** (교육) | 중-높 | 학자금/장학금 정보. data.go.kr에 파일데이터(CSV)만 제공, REST API 미확인. odcloud 자동변환 API 사용 가능성 |
| 18 | **여성가족부 정책자료** | `data.go.kr/data/15057520` | REST | 100~200 | **낮음** | 중 | 한부모/다문화 가족 지원 정책. 이미 보조금24에 포함될 가능성 높음 |
| 19 | **국토교통부 공공임대주택** | `data.go.kr/data/15056574` | REST | 500~1,000 | **중** (주거) | 중 | 국민임대/행복주택 정보. 지원금보다는 주거 서비스 |
| 20 | **마이홈포털** | `myhome.go.kr` | 일부 API | 미상 | **중** (주거) | 높음 | 주거복지 통합 정보. 스크래핑 필요 가능성 |
| 21 | **지자체 개별 포털** | 서울(`data.seoul.go.kr`), 경기(`data.gg.go.kr`) 등 | 지역별 상이 | 각 1,000~5,000 | **상** (지역 밀착) | 높음 | 17개 시도 개별 데이터포털. 통합 난이도 높음. 보조금24로 대부분 커버 가능 |

---

## 3. 개선 권고안

### 3.1 Tier 1: 즉시 실행 (1-2주)

#### 3.1.1 보조금24 API 통합 (최우선)
- **근거**: 행정안전부의 `15113968` API는 중앙부처+지자체+공공기관+교육청의 모든 공공서비스 혜택을 통합 제공
- **예상 효과**: 단일 소스로 10,000+ 서비스 커버. 현재 복지로(Central/Local) + Subsidy24를 포괄하는 상위 소스
- **구현 방법**: 기존 Subsidy24 fetcher 패턴 차용. `SUBSIDY24_API_KEY` 재사용 또는 별도 발급
- **주의**: 기존 Subsidy24/복지로 데이터와 중복 제거 로직 강화 필요. `external_id` 규칙 통일

#### 3.1.2 기업마당 REST API로 마이그레이션
- **근거**: 현재 bizinfo-rss 404 상태. `bizinfo.go.kr/uss/rss/bizinfoApi.do`에 crtfcKey 기반 새 API 존재
- **예상 효과**: 3,000~5,000건/년 최신 지원사업 공고 수집 재개
- **구현 방법**: 기업마당 사이트에서 API 키(crtfcKey) 발급 신청 후 fetcher 재작성
- **추가**: 분야(금융/기술/인력/수출/내수/창업/경영/기타) 필터 활용 → DB category 매핑 강화

#### 3.1.3 Stub Fetcher 활성화 (KOCCA, 중소벤처24)
- **KOCCA**: `data.go.kr/data/15134251` REST API 확인됨. stub 해제하고 실제 fetcher 구현
- **중소벤처24**: `data.go.kr/data/15113191` REST API 확인됨. `syncSmeVenture24` 실제 구현
- **K-Startup**: 기존 B552735 API가 403이면 `data.go.kr/data/15125364` (신규 조회서비스) 대체 시도

### 3.2 Tier 2: 중기 실행 (2-4주)

#### 3.2.1 온통청년 청년정책 API
- **근거**: 청년(19-34세) 전용 정책 500~1,000건. 현재 서비스의 `target_age_min/max` 매칭 차원과 직접 연결
- **실행**: 온통청년(`youthcenter.go.kr`) 회원가입 → 인증키 발급 → data.go.kr `15143273` API 또는 직접 API 연동
- **추가 가치**: 정책 키워드, 법정행정구역코드 등 구조화된 데이터 제공 → 추출 정확도 향상

#### 3.2.2 NTIS 국가R&D 과제검색
- **근거**: 현재 MSIT R&D(~500건, 제목만 추출)보다 훨씬 풍부. 전 부처 R&D 사업 통합
- **실행**: `data.go.kr/data/15077315` 또는 `ntis.go.kr/rndopen/api` 연동
- **주의**: 전문기관 계정이 필요할 수 있음. 대국민용 API는 메타정보 수준

#### 3.2.3 내일배움카드 훈련과정
- **근거**: 직업훈련은 소상공인/청년의 주요 니즈. 5,000+ 과정 정보
- **실행**: `data.go.kr/data/15109032` API 연동
- **확장**: DB 스키마에 훈련/교육 카테고리 추가, benefit_categories 활용

### 3.3 Tier 3: 장기 검토 (1-3개월)

#### 3.3.1 보증/금융 기관 데이터
- 신용보증기금(KODIT), 기술보증기금(KIBO), 주택도시기금의 보증/대출 상품 정보
- 상품 수가 적어(50~100) 초기에는 seed-data로 수동 입력 후 추후 자동화 검토
- 금융 지원은 사용자 니즈 높으나 API 미공개가 핵심 병목

#### 3.3.2 지자체 개별 포털 통합
- 서울/경기/부산 등 대형 지자체 데이터포털
- 보조금24 API가 지자체 서비스를 이미 포함하므로 우선순위 낮음
- 보조금24 미포함 지역 특화 서비스만 선별 수집

#### 3.3.3 소상공인24 연동
- 소상공인시장진흥공단 전용 플랫폼. REST API 공개 여부 확인 필요
- 소상공인 정책자금, 배달/택배료 지원 등 직접적 혜택 정보 포함
- API 미공개 시 기업마당 API로 상당 부분 커버 가능

---

## 4. 데이터 커버리지 매트릭스

### 4.1 개인 (personal) 카테고리

| 카테고리 | 현재 커버리지 | 목표 커버리지 | 필요 소스 | 우선순위 |
|---------|------------|------------|----------|---------|
| **주거** | 10% (복지로 일부) | 70% | 보조금24 API, 주택도시기금, 국토부 임대주택, 마이홈포털 | Tier 1-3 |
| **육아/보육** | 20% (복지로) | 80% | 보조금24 API (포괄적 커버), 여성가족부 | Tier 1 |
| **교육** | 5% | 60% | 보조금24 API, 한국장학재단, 내일배움카드 | Tier 1-2 |
| **취업** | 5% | 70% | 온통청년 API, 워크넷/고용24, 보조금24 | Tier 1-2 |
| **건강** | 15% (복지로) | 60% | 보조금24 API, 건강보험공단 | Tier 1-3 |
| **생활** | 20% (복지로 + Subsidy24) | 80% | 보조금24 API 통합으로 대폭 향상 | Tier 1 |
| **문화** | 5% | 40% | KOCCA API, 보조금24 | Tier 1 |

### 4.2 사업자 (business) 카테고리

| 카테고리 | 현재 커버리지 | 목표 커버리지 | 필요 소스 | 우선순위 |
|---------|------------|------------|----------|---------|
| **금융 (보증/대출)** | 30% (bizinfo odcloud) | 80% | 기업마당 REST API, 신용보증기금, 기술보증기금 | Tier 1/3 |
| **기술 (R&D)** | 20% (MSIT R&D, bizinfo) | 70% | NTIS 통합 R&D, 기업마당 REST API | Tier 1-2 |
| **인력** | 15% (bizinfo) | 60% | 기업마당 REST API (인력 분야 필터), 내일배움카드 | Tier 1-2 |
| **수출** | 10% (bizinfo) | 50% | 기업마당 REST API (수출 분야 필터) | Tier 1 |
| **내수** | 10% (bizinfo) | 50% | 기업마당 REST API (내수 분야 필터) | Tier 1 |
| **창업** | 15% (K-Startup 실패 중) | 80% | K-Startup 신규 API, 기업마당 REST API, 중소벤처24 | Tier 1 |
| **경영** | 15% (bizinfo) | 60% | 기업마당 REST API (경영 분야 필터), 소상공인24 | Tier 1/3 |

---

## 5. 수익화를 위한 데이터 전략

### 5.1 경쟁서비스 대비 차별화 포인트

| 경쟁서비스 | 데이터 소스 | 약점 | 우리 서비스 차별화 |
|-----------|-----------|------|------------------|
| **보조금24 (정부24)** | 자체 데이터 (가장 포괄적) | 검색/필터만 제공, 매칭 알고리즘 없음 | 6차원 가중 점수 매칭 (사업연령/지역/창업자나이/업종/직원수/매출) |
| **기업마당 (bizinfo)** | 자체 + 유관기관 수집 | 기업 지원만, 개인 복지 미포함 | 개인+사업자 통합 매칭 |
| **커넥트웍스** | K-Startup + 중소벤처24 + 기업마당 통합 | 캘린더/목록 표시만, 적격성 판단 없음 | 자동 적격성 스코어링 |
| **THE VC 지원사업** | K-Startup + 중소벤처24 + 기업마당 + 지자체 | 스타트업/VC 특화, 소상공인 미타겟 | 소상공인 + 개인 특화 매칭 |
| **토스 보조금** | 보조금24 연동 | 토스 앱 내 한정 | 독립 웹 서비스 + 상세 분석 |

**핵심 차별화**: 다중 소스 통합 + 자동 적격성 스코어링 + 개인/사업자 통합 매칭

### 5.2 데이터 신선도(Freshness) 전략

| 소스 유형 | 갱신 주기 | 전략 |
|----------|----------|------|
| **공고형** (K-Startup, 기업마당, KOCCA) | 수시 (일 1회 체크 권장) | 일 1회 cron (현재 구현됨) |
| **목록형** (보조금24, 복지로, Subsidy24) | 월 1-2회 갱신 | 주 1회 전체 동기화 + 일 1회 증분 |
| **R&D형** (NTIS, MSIT) | 분기별 대규모 공고 | 주 1회 동기화 |
| **정적형** (보증상품, 주택기금) | 연 1-2회 변경 | 월 1회 체크 |

**권장 cron 스케줄**:
- 매일 03:00 UTC: 공고형 소스 동기화 (현재 구현)
- 매주 월요일 04:00 UTC: 목록형 전체 재동기화
- 매월 1일 05:00 UTC: 정적형 소스 체크

### 5.3 데이터 품질 KPI

| KPI | 현재 | 목표 | 측정 방법 |
|-----|------|------|----------|
| **소스 가동률** | 4/9 (44%) | 9/9+ (100%) | sync_logs 성공률 |
| **추출 정확도** | 불명 (미측정) | 80%+ | 샘플링 검증 (100건/월 수동 확인) |
| **데이터 신선도** | 일 1회 | 일 1회 (공고), 주 1회 (목록) | sync_logs 최종 성공 시각 |
| **커버리지 (사업자)** | ~100,000건 | ~120,000건 | DB 총 레코드 수 |
| **커버리지 (개인)** | ~6,000건 | ~15,000건+ | service_type='personal' 또는 'both' 레코드 수 |
| **중복률** | 불명 | 5% 이하 | dedup 로직 결과 |
| **매칭 적중률** | 불명 | 70%+ (상위 10건 중 적격 7건+) | 사용자 피드백 수집 |

### 5.4 실행 로드맵 요약

```
Week 1-2 (Tier 1):
  [1] 보조금24 API (15113968) 연동 → 개인 커버리지 대폭 향상
  [2] 기업마당 REST API 마이그레이션 → 사업자 공고 수집 재개
  [3] KOCCA/중소벤처24 stub 활성화
  [4] K-Startup 15125364 대체 시도

Week 3-4 (Tier 2 시작):
  [5] 온통청년 API 연동 → 청년 타겟 강화
  [6] NTIS R&D API → 현재 MSIT R&D 대체/보완
  [7] 내일배움카드 훈련과정 → 교육/훈련 차원 추가

Month 2-3 (Tier 2 완료 + Tier 3 시작):
  [8] 워크넷/고용24 선별 연동
  [9] 보증기관 수동 데이터 입력
  [10] 소상공인24 API 가용성 확인
```

---

## 6. 기술적 개선 사항

### 6.1 현재 아키텍처 문제점

1. **API 호출 제한 관리 부재**: 복지로 API가 일 100건 제한인데 numOfRows=10으로 고정되어 10페이지/일 밖에 처리 못함. numOfRows를 API 허용 최대값으로 상향 필요
2. **추출 정확도 불투명**: `extraction_confidence` 필드가 있으나 실제 검증/피드백 루프 없음
3. **중복 제거 한계**: `external_id` 기반이라 다른 소스에서 동일 사업을 가져올 때 중복 발생 (예: 복지로 + 보조금24)
4. **MSIT R&D 추출 품질**: 제목(subject)만으로 extractEligibility 호출. 사실상 무의미한 추출
5. **service_type 판정**: 키워드 기반 (`기업|사업자|소상공인|법인|자영업`) 으로 부정확

### 6.2 권장 개선

1. **cross-source 중복 제거**: 제목 유사도(Levenshtein/Jaro-Winkler) + 기관명 매칭으로 교차 소스 dedup
2. **추출 정확도 측정**: 주기적 샘플링 + 수동 라벨링 → extraction_confidence 보정
3. **보조금24 API 중심 재설계**: 보조금24가 가장 포괄적이므로 1차 소스로 설정, 나머지는 보완 소스로 활용
4. **numOfRows 최적화**: API별 허용 최대값 조사 후 적용 (일반적으로 100~1000)
5. **구조화 데이터 우선 활용**: 텍스트 추출 대신 API가 제공하는 구조화 필드(대상, 지역코드, 연령 등) 직접 매핑

---

## 부록: API 엔드포인트 정리

### 현재 사용 중

| 소스 | 엔드포인트 |
|------|----------|
| Bokjiro Central | `https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist` |
| Bokjiro Local | `https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfaredetailed` |
| Subsidy24 | `https://api.odcloud.kr/api/gov24/v3/serviceList` |
| MSIT R&D | `https://apis.data.go.kr/1721000/msitannouncementinfo/businessAnnouncMentList` |
| K-Startup (403) | `https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01` |
| Bizinfo RSS (404) | `https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/rssFeed.do` |
| Bizinfo odcloud | `https://api.odcloud.kr/api/3034791/v1/uddi:...` |

### 신규 통합 대상

| 소스 | 엔드포인트/데이터셋 ID | 키 발급 |
|------|----------------------|--------|
| 보조금24 (정부24) | `data.go.kr/data/15113968` | data.go.kr 활용신청 |
| 기업마당 REST | `bizinfo.go.kr/uss/rss/bizinfoApi.do` | bizinfo.go.kr crtfcKey 발급 |
| 중소벤처24 | `data.go.kr/data/15113191` | data.go.kr 활용신청 |
| KOCCA | `data.go.kr/data/15134251` | data.go.kr 활용신청 |
| K-Startup (신규) | `data.go.kr/data/15125364` | data.go.kr 활용신청 |
| 중소벤처기업부 사업공고 | `data.go.kr/data/15113297` | data.go.kr 활용신청 |
| 온통청년 | `data.go.kr/data/15143273` / `youthcenter.go.kr` API | 온통청년 회원가입 + 인증키 |
| 내일배움카드 | `data.go.kr/data/15109032` | data.go.kr 활용신청 |
| NTIS R&D | `data.go.kr/data/15077315` / `ntis.go.kr/rndopen/api` | data.go.kr 또는 NTIS 계정 |

---

## 참고 출처

- [공공데이터포털](https://www.data.go.kr/)
- [행정안전부 보조금24 API](https://www.data.go.kr/data/15113968/openapi.do)
- [기업마당 지원사업정보 API](https://www.bizinfo.go.kr/web/lay1/program/S1T175C174/apiDetail.do?id=bizinfoApi)
- [중소벤처24 Open API](https://www.smes.go.kr/main/dbCnrs)
- [중소기업기술정보진흥원 중소벤처24 공고정보](https://www.data.go.kr/data/15113191/openapi.do)
- [한국콘텐츠진흥원 지원사업공고](https://www.data.go.kr/data/15134251/openapi.do)
- [창업진흥원 K-Startup 조회서비스](https://www.data.go.kr/data/15125364/openapi.do)
- [한국고용정보원 온통청년 청년정책API](https://www.data.go.kr/data/15143273/openapi.do)
- [온통청년 OPEN API](https://www.youthcenter.go.kr/cmnFooter/openapiIntro/oaiDoc)
- [한국고용정보원 내일배움카드 훈련과정](https://www.data.go.kr/data/15109032/openapi.do)
- [NTIS OpenAPI](https://www.ntis.go.kr/rndopen/api/mng/apiMain.do)
- [한국과학기술정보연구원 국가R&D 과제검색](https://www.data.go.kr/data/15077315/openapi.do)
- [중소벤처기업부 사업공고](https://www.data.go.kr/data/15113297/openapi.do)
- [고용24 Open API](https://www.work24.go.kr/cm/e/a/0110/selectOpenApiIntro.do)
- [워크넷 채용정보 API](https://www.data.go.kr/data/3038225/openapi.do)
- [소상공인24](https://www.sbiz24.kr/)
- [소상공인시장진흥공단 상가정보 API](https://www.data.go.kr/data/15012005/openapi.do)
- [주택도시보증공사 기금e든든](https://www.data.go.kr/data/15134235/fileData.do)
- [정부24 공공서비스 Open API](https://www.gov.kr/openapi)
- [커넥트웍스](https://works.connect24.kr/)
- [THE VC 지원사업](https://thevc.kr/grants)
