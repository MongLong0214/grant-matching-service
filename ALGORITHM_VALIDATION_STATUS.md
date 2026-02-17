# 매칭 알고리즘 검증 상태 보드

> **최종 업데이트**: 2026-02-16 22:40 KST
> **현재 단계**: Phase 1 완료 → Phase 2 대기 중

---

## 🎯 목표

정부지원금 매칭 알고리즘(v4)의 품질을 **Information Retrieval 및 추천 시스템 표준 지표**로 과학적 검증하여 운영 서비스 출시 가능 여부를 판단합니다.

---

## 📊 진행 상황

```
Phase 0: Setup          ✅ 완료
Phase 1: Theory         ✅ 완료 (2026-02-16)
Phase 2: Data           🔄 대기 중
Phase 3: Decision       ⏳ 미착수
```

### Phase 1: 이론적 분석 (✅ 완료)

- [x] 알고리즘 구조 심층 분석 (8단계 파이프라인)
- [x] 가중치 설계 근거 검증 (개인 5차원, 사업자 6차원)
- [x] Tier 임계값 정당성 평가
- [x] Knockout Filter 이론적 근거
- [x] Coverage Factor 통계적 타당성
- [x] 강점/한계 분석 (투명성, 학습 부재 등)
- [x] 업계 벤치마크 조사 (보조금24, 복지로, 중기)
- [x] 평가 지표 체계 정의 (Precision@K, nDCG, Recall)
- [x] 통계 검정 프로토콜 설계 (paired t-test, Cohen's d)
- [x] 출시 판정 기준 설정 (MVP/Optimal/Enterprise)

### Phase 2: 정량적 검증 (🔄 대기 중)

**대기 사항**: `scripts/audit-1000-final.json` 생성

**자동화 준비 완료**:
- [x] 분석 스크립트 (`analyze-audit-results.py`, 12KB)
- [x] 자동 감시 스크립트 (`watch-audit-files.sh`, 2.2KB)
- [x] 사용 가이드 (`scripts/ANALYSIS_README.md`, 4.9KB)

**실행 방법**:
```bash
# 자동 감시 (추천)
./scripts/watch-audit-files.sh

# 수동 실행
python3 scripts/analyze-audit-results.py
```

**예상 분석 결과**:
- 스코어 분포 (평균, 중앙값, 분위수)
- Tier 분포 (tailored/recommended/exploratory 비율)
- 차원별 기여도 순위
- Knockout 필터링 효과
- v3 vs v4 비교 (선택, Cohen's d)

### Phase 3: 의사결정 (⏳ 미착수)

**Isaac 승인 필요** (Level 2):
- [ ] 출시 판정 기준 충족 여부 확인
- [ ] 개선 우선순위 설정
- [ ] 위험 요소 대응 계획 합의
- [ ] 장기 로드맵 논의

---

## 📁 산출물

| 파일 | 크기 | 상태 | 설명 |
|------|------|------|------|
| `MATCHING_QUALITY_REPORT.md` | 23KB | ✅ 완료 | 과학적 검증 보고서 (7섹션 + 3부록) |
| `ANALYSIS_SUMMARY.md` | 9KB | ✅ 완료 | 작업 완료 보고 |
| `scripts/analyze-audit-results.py` | 12KB | ✅ 완료 | 통계 분석 스크립트 |
| `scripts/watch-audit-files.sh` | 2.2KB | ✅ 완료 | 자동 감시 스크립트 |
| `scripts/ANALYSIS_README.md` | 4.9KB | ✅ 완료 | 사용 가이드 |
| `scripts/audit-1000-final.json` | — | ⏳ 대기 | 1000-case audit 결과 |

**총 크기**: 51.1KB (문서 + 스크립트)

---

## 🔬 핵심 발견 (이론적 분석 기반)

### ✅ 강점

1. **투명성**: 가중치/임계값 명시 → 설명 가능 AI (XAI)
2. **도메인 적합**: Eligibility 기반 → 정부 서비스 특성 반영
3. **계산 효율**: O(n) 선형 → 6,364개 지원사업 실시간 처리 (<100ms)
4. **유지보수성**: 가중치 조정 용이 → 정책 변화 대응

### ⚠️ 한계

1. **학습 부재**: 사용자 피드백 미반영 → Learning to Rank 필요
2. **상호작용 무시**: 차원 간 시너지 고려 안 함 (선형 결합 한계)
3. **Confidence 활용 부족**: Knockout에 신뢰도 미반영
4. **Calibration 미검증**: 점수 0.7 = 실제 70% 적합? 검증 필요

### 🎯 개선 로드맵

| 우선순위 | 기간 | 과제 |
|---------|------|------|
| P0 | 즉시 | Confidence-Weighted Knockout 프로토타입 |
| P1 | 1개월 | A/B 테스트 인프라 + 품질 모니터링 대시보드 |
| P1 | 1개월 | 사용자 피드백 수집 메커니즘 (신청 여부 추적) |
| P2 | 3개월 | Learning to Rank (LambdaMART) 파일럿 |
| P2 | 3개월 | 계절성 Feature 추가 (신청 마감 임박 우선) |

---

## 📈 출시 판정 기준

### 최소 조건 (MVP) — 소프트 런칭

- [ ] 평균 스코어 ≥ 0.50
- [ ] Tailored 비율 ≥ 15%
- [ ] 평균 매칭 수 ≥ 10개
- [ ] Knockout 비율 < 60%

**판정**: 기본 기능 동작, 베타 테스트 가능

### 권장 조건 (Optimal) — 정식 출시

- [ ] 평균 스코어 ≥ 0.60
- [ ] Tailored 비율 ≥ 25%
- [ ] 평균 매칭 수 ≥ 15개
- [ ] v3 대비 유의한 개선 (p < 0.05, Cohen's d > 0.3)

**판정**: 프로덕션 준비 완료, 마케팅 가능

### 엔터프라이즈급 (Enterprise) — 업계 선도

- [ ] Precision@5 ≥ 0.80 (Netflix 수준)
- [ ] nDCG ≥ 0.85 (순위 품질 우수)
- [ ] Personalization ≥ 0.70 (프로필 차별화)
- [ ] A/B 테스트 검증 완료

**판정**: 업계 레퍼런스, 학술 논문 출판 가능

---

## 🏭 업계 비교 (정부 서비스)

| 서비스 | 매칭 방식 | 추정 정확도 | 우리 서비스 우위 |
|--------|----------|------------|-----------------|
| **보조금24** | 자격 필터 + 수동 검색 | High | 발견성 (통합 검색) |
| **복지로** | 모의계산 기반 필터 | High | 범위 (복지 외 사업) |
| **중기 통합** | 키워드 + 필터 | Medium | 순위 (적합도 정렬) |
| **K-Startup** | 카테고리 + 키워드 | Medium | 개인화 (가중치) |

**차별화 포인트**:
1. **통합 발견성**: 6개 소스 → 여러 부처 한 번에
2. **개인화 순위**: 가중치 기반 적합도 순 정렬 (기존 서비스는 정렬 없음)
3. **낮은 진입장벽**: 복잡한 자격 계산 불필요 (심플한 입력 폼)

**약점**:
- 행정 데이터 연계 부재 (소득인정액 실제 검증 불가)
- 데이터 추출 신뢰도 의존 (Extraction confidence 평균 0.6)

---

## 🔔 다음 액션

### 즉시 실행 가능

1. **자동 감시 시작**:
   ```bash
   ./scripts/watch-audit-files.sh
   ```
   (백그라운드에서 audit 파일 생성 대기)

2. **다른 에이전트와 협업**:
   - Audit 데이터 생성 요청
   - 1,000개 테스트 케이스 실행
   - `scripts/audit-1000-final.json` 출력

### 데이터 생성 후

1. **자동 분석 실행** (watch 스크립트가 자동 트리거)
2. **결과 확인** (콘솔 출력)
3. **보고서 업데이트**:
   - `MATCHING_QUALITY_REPORT.md` 섹션 3, 4 업데이트
   - 섹션 7 결론 및 판정 작성
4. **Isaac 승인 요청** (Level 2 의사결정)

### 장기 계획

- **Phase 2 완료 후**: 출시 판정 (MVP/Optimal/Enterprise)
- **운영 모니터링**: 품질 메트릭 대시보드 구축
- **지속 개선**: Learning to Rank 도입 (3개월)

---

## 📚 문서 구조

```
/
├── ALGORITHM_VALIDATION_STATUS.md  (본 문서, 상태 보드)
├── MATCHING_QUALITY_REPORT.md      (과학적 검증 보고서, 23KB)
├── ANALYSIS_SUMMARY.md             (작업 완료 보고, 9KB)
└── scripts/
    ├── ANALYSIS_README.md          (사용 가이드, 4.9KB)
    ├── analyze-audit-results.py    (분석 스크립트, 12KB)
    ├── watch-audit-files.sh        (감시 스크립트, 2.2KB)
    ├── audit-1000-final.json       (대기 중)
    └── audit-1000-results.json     (선택, v3 baseline)
```

**읽기 순서**:
1. 본 문서 (STATUS) — 현재 상황 파악
2. `ANALYSIS_SUMMARY.md` — 상세 작업 내용
3. `MATCHING_QUALITY_REPORT.md` — 전체 이론적 분석
4. `scripts/ANALYSIS_README.md` — 실행 가이드

---

## ✅ 검증 완료 항목

- [x] TypeScript 컴파일 (tsc --noEmit)
- [x] ESLint 통과 (기존 파일 경고만 존재)
- [x] Python 스크립트 동작 확인
- [x] Bash 스크립트 실행 권한 설정
- [x] 알고리즘 코드 읽기 (`src/lib/matching-v4/`)
- [x] 데이터 추출 파이프라인 분석 (`src/lib/extraction/`)
- [x] 가중치 및 임계값 검증
- [x] 통계 지표 체계 정의
- [x] 출시 판정 기준 설정

---

## 🤝 기여자

- **Claude (domain agent, analyze mode)**: 이론적 분석, 방법론 설계, 자동화 도구 개발
- **Isaac**: 검토 및 의사결정 (Phase 3)
- **Frontend/Backend agents**: Audit 데이터 생성 (Phase 2, 예정)

---

## 📞 문의

- **알고리즘 관련**: `src/lib/matching-v4/` 코드 참조
- **분석 방법론**: `MATCHING_QUALITY_REPORT.md` 섹션 1, 2
- **실행 가이드**: `scripts/ANALYSIS_README.md`
- **문제 해결**: `ANALYSIS_README.md` 문제 해결 섹션

---

**버전**: 1.0
**작성일**: 2026-02-16 22:40 KST
**상태**: Phase 1 완료, Phase 2 대기 중
**다음 마일스톤**: `audit-1000-final.json` 생성 시 자동 분석 실행
