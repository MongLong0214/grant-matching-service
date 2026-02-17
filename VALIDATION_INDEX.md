# 매칭 알고리즘 검증 — 문서 인덱스

> **빠른 시작**: `./scripts/watch-audit-files.sh` 실행 후 audit 데이터 생성 대기

---

## 📚 문서 읽기 순서

### 1️⃣ 현재 상황 파악
**파일**: [`ALGORITHM_VALIDATION_STATUS.md`](./ALGORITHM_VALIDATION_STATUS.md)
- 진행 상황 (Phase 1 완료 → Phase 2 대기)
- 산출물 목록
- 출시 판정 기준
- 다음 액션

### 2️⃣ 작업 상세 내용
**파일**: [`ANALYSIS_SUMMARY.md`](./ANALYSIS_SUMMARY.md)
- Mission 완료 상태
- 산출물 체크리스트
- 이론적 분석 결과
- 개선 로드맵

### 3️⃣ 이론적 분석 전체
**파일**: [`MATCHING_QUALITY_REPORT.md`](./MATCHING_QUALITY_REPORT.md)
- 방법론 (IR/RS 표준 지표)
- 알고리즘 구조 분석
- 가중치 설계 근거
- 업계 벤치마크
- 출시 판정 기준 (3단계)

### 4️⃣ 실행 가이드
**파일**: [`scripts/ANALYSIS_README.md`](./scripts/ANALYSIS_README.md)
- 워크플로우 (3단계)
- 분석 지표 설명
- 문제 해결 가이드

---

## 🛠️ 도구

### Python 분석 스크립트
**파일**: [`scripts/analyze-audit-results.py`](./scripts/analyze-audit-results.py)

**실행**:
```bash
python3 scripts/analyze-audit-results.py
```

**기능**:
- 스코어 분포 분석
- Tier 분포 분석
- 차원별 기여도 분석
- Knockout 효과 분석
- v3 vs v4 비교

### Bash 자동 감시 스크립트
**파일**: [`scripts/watch-audit-files.sh`](./scripts/watch-audit-files.sh)

**실행**:
```bash
./scripts/watch-audit-files.sh
```

**기능**:
- `audit-1000-final.json` 생성 감지
- 자동 분석 실행
- 5초 주기 체크

---

## 🎯 출시 판정 기준

### MVP (최소 조건)
- 평균 스코어 ≥ 0.50
- Tailored 비율 ≥ 15%
- 평균 매칭 수 ≥ 10개
- Knockout 비율 < 60%

### Optimal (권장)
- 평균 스코어 ≥ 0.60
- Tailored 비율 ≥ 25%
- 평균 매칭 수 ≥ 15개
- v3 대비 유의 개선

### Enterprise (엔터프라이즈급)
- Precision@5 ≥ 0.80
- nDCG ≥ 0.85
- Personalization ≥ 0.70

---

## 🔔 다음 액션

1. **자동 감시 시작** (추천):
   ```bash
   ./scripts/watch-audit-files.sh
   ```

2. **Audit 데이터 생성** (다른 에이전트):
   - 1,000개 테스트 케이스 실행
   - `scripts/audit-1000-final.json` 출력

3. **자동 분석 실행** (watch 스크립트 자동 트리거)

4. **보고서 업데이트**:
   - `MATCHING_QUALITY_REPORT.md` 섹션 3, 4 업데이트
   - 섹션 7 결론 작성

5. **Isaac 승인 요청** (Level 2 의사결정)

---

**작성일**: 2026-02-16
**작성자**: Claude (domain agent, analyze mode)
