# 매칭 알고리즘 품질 분석 워크플로우

## 개요

정부지원금 매칭 알고리즘(v4)의 품질을 과학적으로 검증하기 위한 자동화 분석 도구 세트입니다.

## 파일 구조

```
scripts/
├── analyze-audit-results.py    # 통계 분석 스크립트 (Python)
├── watch-audit-files.sh         # 파일 감시 스크립트 (Bash)
├── ANALYSIS_README.md           # 본 문서
├── audit-1000-final.json        # (생성 예정) v4 audit 결과
└── audit-1000-results.json      # (선택) v3 baseline 결과

/
└── MATCHING_QUALITY_REPORT.md   # 최종 분석 보고서
```

## 워크플로우

### Phase 1: Audit 데이터 생성

다른 에이전트가 1,000개 테스트 케이스로 매칭 알고리즘을 실행하여 결과를 생성합니다.

**필수 출력 파일**: `scripts/audit-1000-final.json`

**JSON 스키마 예시**:
```json
[
  {
    "profileId": "business_001",
    "userType": "business",
    "score": 0.68,
    "tier": "recommended",
    "breakdown": {
      "region": 0.85,
      "businessAge": 0.70,
      "businessType": 0.60,
      "employee": 0.55,
      "founderAge": 0.50,
      "revenue": 0.45
    },
    "confidence": 0.75,
    "totalAnalyzed": 6364,
    "knockedOut": 3200,
    "filteredByServiceType": 800,
    "totalCount": 15,
    "matchedSupports": [
      {
        "supportId": "supp_123",
        "score": 0.75,
        "tier": "tailored"
      }
    ]
  }
]
```

### Phase 2: 자동 분석 실행

#### 방법 A: 자동 감시 (추천)

터미널에서 실행:
```bash
./scripts/watch-audit-files.sh
```

- `audit-1000-final.json` 파일 생성을 5초마다 체크
- 파일 생성 시 자동으로 분석 시작
- 완료 후 종료

#### 방법 B: 수동 실행

파일이 이미 존재하는 경우:
```bash
python3 scripts/analyze-audit-results.py
```

### Phase 3: 결과 확인

분석 스크립트는 다음을 콘솔에 출력합니다:

1. **스코어 분포 분석**
   - 평균, 중앙값, 표준편차, 분위수
   - 점수 구간별 분포 (Tailored/Recommended/Exploratory)

2. **Tier 분포 분석**
   - 각 Tier별 케이스 수와 비율

3. **차원별 기여도 분석**
   - 각 차원(region, businessAge 등)의 평균 점수
   - 기여도 순위

4. **Knockout 필터링 효과**
   - 평균 분석 대상 수
   - Service Type / Knockout 필터링 비율
   - 최종 매칭 수

5. **v3 vs v4 비교 (선택)**
   - 평균/중앙값 비교
   - 개선율 계산
   - Cohen's d (Effect Size)
   - Tier 이동 통계

## 분석 지표 설명

### 기본 통계량

| 지표 | 설명 |
|------|------|
| **Mean** | 평균값 |
| **Median** | 중앙값 (이상치 영향 적음) |
| **Stdev** | 표준편차 (분산 정도) |
| **Q1, Q3** | 25%, 75% 분위수 |
| **IQR** | Q3 - Q1 (중간 50% 범위) |

### Effect Size (Cohen's d)

| 값 | 해석 |
|----|------|
| d < 0.2 | Negligible (무시 가능) |
| 0.2 ≤ d < 0.5 | Small (작은 효과) |
| 0.5 ≤ d < 0.8 | Medium (중간 효과) |
| d ≥ 0.8 | Large (큰 효과) |

### Tier 임계값

| Tier | 점수 범위 | 의미 |
|------|----------|------|
| Tailored | ≥ 0.55 | 확실 적합 |
| Recommended | 0.35-0.54 | 가능성 높음 |
| Exploratory | 0.15-0.34 | 탐색 가치 |

## 출시 판정 기준

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

## 보고서 업데이트

분석 완료 후 수동으로 `MATCHING_QUALITY_REPORT.md`를 업데이트:

1. 콘솔 출력 결과를 복사
2. 보고서의 "3. 정량적 결과" 섹션에 붙여넣기
3. "7. 결론 및 권고" 섹션에 판정 작성

## 문제 해결

### "audit-1000-final.json 파일 없음" 에러

**원인**: Audit 데이터가 아직 생성되지 않음

**해결**:
1. 다른 에이전트가 테스트 케이스를 실행하도록 대기
2. 또는 `watch-audit-files.sh`로 자동 대기

### "비교 데이터 불충분" 경고

**원인**: v3 baseline 파일 없음

**해결**: 정상 동작. v4 단독 분석만 수행됨. v3 비교는 선택 사항.

### Python 의존성 에러

**원인**: Python 3.7+ 필요

**해결**:
```bash
python3 --version  # 버전 확인
# Python 3.7+ 설치 필요 시 homebrew 사용
brew install python@3.11
```

## 다음 단계

분석 완료 후:

1. **보고서 검토**: `MATCHING_QUALITY_REPORT.md` 확인
2. **출시 판정**: 최소 조건 충족 여부 확인
3. **개선 계획**: 병목 지점 식별 및 우선순위 설정
4. **Isaac 승인**: Level 2 판정 (데이터 기반 의사결정)

## 참고 문서

- `MATCHING_QUALITY_REPORT.md` — 전체 분석 보고서
- `src/lib/matching-v4/` — 알고리즘 코드
- `src/lib/extraction/` — 데이터 추출 파이프라인

---

**작성일**: 2026-02-16
**작성자**: Claude (domain agent, analyze mode)
