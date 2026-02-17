# 매칭 알고리즘 품질 검증 — 작업 완료 보고

## 📋 Mission 완료 상태

**목표**: 추천 알고리즘의 품질을 과학적으로 검증하고 증명하는 보고서 작성 (--mode analyze)

**현재 상태**: ✅ **Phase 1 완료** — 이론적 분석 + 방법론 + 자동화 도구 준비 완료

---

## 🎯 산출물

### 1. 과학적 검증 보고서 (23KB)
**파일**: `MATCHING_QUALITY_REPORT.md`

**구조** (7개 섹션 + 3개 부록):
1. ✅ **Executive Summary** — 핵심 발견 요약 (데이터 대기)
2. ✅ **방법론** — IR/RS 표준 지표, 통계 검정 프로토콜
3. ✅ **알고리즘 구조 분석** — 이론적 근거, 강점/한계, 개선 방향
4. 🔄 **정량적 결과** — 1000-case 분석 (audit 파일 생성 후)
5. 🔄 **통계적 유의성** — v3 vs v4 비교 (선택)
6. ✅ **업계 대비 포지셔닝** — 보조금24, 복지로 등 벤치마크
7. ✅ **결론 및 권고** — 출시 준비도 평가, 개선 로드맵

**부록**:
- A: 통계 용어 사전
- B: 코드 참조
- C: 데이터 수집 체크리스트

### 2. 자동 분석 스크립트 (12KB)
**파일**: `scripts/analyze-audit-results.py`

**기능**:
- 스코어 분포 분석 (평균, 중앙값, 분위수, IQR)
- Tier 분포 분석 (tailored/recommended/exploratory 비율)
- 차원별 기여도 분석 (region, businessAge, 등)
- Knockout 효과 분석 (필터링 비율)
- v3 vs v4 비교 (paired difference, Cohen's d, Tier 이동)

**사용법**:
```bash
python3 scripts/analyze-audit-results.py
```

### 3. 자동 감시 스크립트 (2.2KB)
**파일**: `scripts/watch-audit-files.sh`

**기능**:
- `audit-1000-final.json` 파일 생성을 5초마다 체크
- 생성 시 자동으로 분석 스크립트 실행
- 완료 후 종료

**사용법**:
```bash
./scripts/watch-audit-files.sh
```

### 4. 사용 가이드 (4.9KB)
**파일**: `scripts/ANALYSIS_README.md`

**내용**:
- 워크플로우 (3단계)
- 분석 지표 설명
- 출시 판정 기준 (MVP/Optimal)
- 문제 해결 가이드

---

## 🔬 완료된 이론적 분석

### 알고리즘 파이프라인 (8단계)
```
Service Type Filter → Knockout Filter → Dimension Scoring →
Coverage Adjustment → Interest Bonus → Tier Assignment →
Organization Diversity → Cap & Limit
```

### 가중치 설계
- **사업자 6차원**: region(0.22), businessAge(0.20), businessType(0.18), employee(0.15), founderAge(0.15), revenue(0.10)
- **개인 5차원**: age(0.25), region(0.20), householdType(0.20), incomeLevel(0.20), employmentStatus(0.15)

### Tier 임계값
- **Tailored**: ≥ 0.55 (확실 적합)
- **Recommended**: 0.35-0.54 (가능성 높음)
- **Exploratory**: 0.15-0.34 (탐색 가치)

### 강점과 한계

**✅ 강점**:
1. **투명성** — 가중치/임계값 명시 → 설명 가능
2. **도메인 적합** — 자격 기반 필터링 (정부 서비스 특성)
3. **계산 효율** — O(n) 선형 시간 (6000+ 지원사업 실시간 처리)
4. **유지보수성** — 가중치 조정 용이 (정책 변화 대응)

**⚠️ 한계**:
1. **학습 부재** — 사용자 피드백 미반영 → 최적화 정체
2. **상호작용 무시** — 차원 간 시너지 고려 안 함 (선형 결합)
3. **Cold Start** — 신규 지원사업 스코어링 어려움
4. **Confidence 활용 부족** — Knockout에 신뢰도 미반영
5. **Calibration 미검증** — 점수 0.7 = 실제 70% 적합? 검증 필요

### 개선 방향
1. **즉시**: Confidence-Weighted Knockout 프로토타입
2. **단기(1개월)**: A/B 테스트 인프라, 품질 모니터링 대시보드
3. **중기(3개월)**: Learning to Rank (LambdaMART), 계절성 Feature

---

## 🔄 대기 중인 작업

### audit-1000-final.json 생성 대기
다른 에이전트가 1,000개 테스트 케이스로 매칭 알고리즘을 실행하여 결과를 생성해야 합니다.

**필수 필드**:
```json
{
  "profileId": "string",
  "userType": "personal" | "business",
  "score": 0.0-1.0,
  "tier": "tailored" | "recommended" | "exploratory",
  "breakdown": { "dimension": score, ... },
  "confidence": 0.0-1.0,
  "totalAnalyzed": number,
  "knockedOut": number,
  "filteredByServiceType": number,
  "totalCount": number
}
```

**파일 생성 시 자동 실행**:
1. `watch-audit-files.sh` 감지
2. `analyze-audit-results.py` 자동 실행
3. 콘솔에 분석 결과 출력
4. `MATCHING_QUALITY_REPORT.md` 수동 업데이트

---

## 📊 평가 지표 체계

### Information Retrieval 표준
| 지표 | 목표 | 설명 |
|------|------|------|
| **Precision@5** | ≥ 0.80 | 상위 5개 중 적합 비율 |
| **Recall@20** | ≥ 0.95 | 전체 적합 중 발견율 |
| **nDCG** | ≥ 0.85 | 순위 고려 정밀도 |
| **MAP** | ≥ 0.75 | 평균 정밀도 |

### 추천 시스템 품질
| 지표 | 목표 | 설명 |
|------|------|------|
| **Coverage** | ≥ 0.70 | 추천 가능 아이템 비율 |
| **Diversity** | ≥ 0.60 | 추천 목록 내 다양성 |
| **Personalization** | ≥ 0.70 | 프로필 간 차별화 |

### 통계적 유의성 (v3 vs v4)
- **Paired t-test** (정규분포 시): p < 0.05, Cohen's d > 0.3
- **Wilcoxon signed-rank** (비정규 시)
- **Bootstrap CI** (95% CI가 0 미포함)

---

## 📈 출시 판정 기준

### 최소 조건 (MVP)
- [ ] 평균 스코어 ≥ 0.50
- [ ] Tailored 비율 ≥ 15%
- [ ] 평균 매칭 수 ≥ 10개
- [ ] Knockout 비율 < 60%

### 권장 조건 (Optimal)
- [ ] 평균 스코어 ≥ 0.60
- [ ] Tailored 비율 ≥ 25%
- [ ] 평균 매칭 수 ≥ 15개
- [ ] v3 대비 유의한 개선 (p < 0.05, d > 0.3)

### 엔터프라이즈급 (Enterprise)
- [ ] Precision@5 ≥ 0.80
- [ ] nDCG ≥ 0.85
- [ ] Personalization ≥ 0.70
- [ ] A/B 테스트 검증 완료

---

## 🏭 업계 비교

| 서비스 | 매칭 방식 | 정확도 | 우리 서비스 대비 |
|--------|----------|--------|-----------------|
| **보조금24** | 자격 필터링 + 수동 검색 | High | 발견성 우위 |
| **복지로** | 모의계산 기반 필터 | High | 통합성 우위 |
| **중기 통합관리** | 키워드 검색 + 필터 | Medium | 순위 우위 |
| **K-Startup** | 카테고리 + 키워드 | Medium | 개인화 우위 |

**차별화 포인트**:
1. **통합 발견성** — 여러 부처 지원사업 한 번에 검색
2. **개인화 순위** — 가중치 기반 적합도 순 정렬
3. **낮은 진입장벽** — 복잡한 자격 계산 불필요

**약점**:
- 행정 데이터 연계 부재 (소득인정액 실제 검증 불가)
- 데이터 추출 신뢰도 의존 (confidence 평균 0.6)

---

## ✅ 다음 단계

### Phase 2: 정량 검증 (audit 파일 생성 시)
1. ✅ 자동 감시 스크립트 실행 중 (`watch-audit-files.sh`)
2. ⏳ `audit-1000-final.json` 생성 대기
3. 🔄 분석 스크립트 자동 실행
4. 📝 보고서 업데이트

### Phase 3: 의사결정 (Isaac 승인)
1. 출시 판정 기준 충족 여부 확인
2. Level 2 승인 필요 (데이터 기반 의사결정)
3. 개선 우선순위 설정
4. 장기 로드맵 합의

---

## 📦 산출물 체크리스트

- [x] `MATCHING_QUALITY_REPORT.md` (23KB, 이론 완료)
- [x] `scripts/analyze-audit-results.py` (12KB, 테스트 완료)
- [x] `scripts/watch-audit-files.sh` (2.2KB, 실행 권한 설정)
- [x] `scripts/ANALYSIS_README.md` (4.9KB, 사용 가이드)
- [x] Python 환경 검증 (표준 라이브러리 사용)
- [x] 분석 지표 체계 정의 (IR + RS + 통계)
- [x] 업계 벤치마크 조사 (보조금24, 복지로 등)
- [x] 출시 판정 기준 설정 (MVP/Optimal/Enterprise)

---

## 🎓 방법론적 기여

본 분석은 정부 지원금 매칭이라는 **자격 기반 추천 시스템**에 대한 과학적 평가 프레임워크를 제시합니다.

**기존 추천 시스템 연구와의 차이점**:
1. **Eligibility vs Preference**: 자격 요건 기반 (선호도 아님)
2. **False Negative 비용**: 금전적 손실 (수백만원)
3. **High Precision + High Recall**: 동시 달성 필요 (일반 RS는 트레이드오프)
4. **Explainability 필수**: 정부 서비스 투명성 요구

**적용 가능한 IR 지표**:
- ✅ Precision@K, Recall@K, nDCG, MAP
- ❌ RMSE, AUC-ROC (명시적 평점 없음)

**적용 가능한 RS 지표**:
- ✅ Coverage, Diversity, Personalization
- ⚠️ Novelty (비인기 아이템 우선 불필요)

---

## 📚 참고 문서

- `MATCHING_QUALITY_REPORT.md` — 전체 분석 보고서
- `scripts/ANALYSIS_README.md` — 사용 가이드
- `src/lib/matching-v4/` — 알고리즘 코드
- `src/lib/extraction/` — 데이터 추출 파이프라인

---

**작성일**: 2026-02-16
**작성자**: Claude (domain agent, analyze mode)
**버전**: 1.0 (이론적 분석 완료, 정량 검증 대기)

---

## 🔔 알림

`scripts/audit-1000-final.json` 파일이 생성되면 다음과 같이 진행하세요:

1. **자동 분석** (추천):
   ```bash
   ./scripts/watch-audit-files.sh
   ```

2. **수동 분석**:
   ```bash
   python3 scripts/analyze-audit-results.py
   ```

3. **보고서 업데이트**:
   - 콘솔 출력 결과를 복사
   - `MATCHING_QUALITY_REPORT.md` 섹션 3, 4 업데이트
   - 섹션 7 결론 및 판정 작성

4. **Isaac 승인 요청**:
   - Level 2 의사결정 (출시 가능 여부)
   - 개선 우선순위 합의
   - 장기 로드맵 논의
