#!/usr/bin/env python3
"""
정부지원금 매칭 알고리즘 Audit 결과 자동 분석 스크립트

사용법:
    python scripts/analyze-audit-results.py

필수 파일:
    - scripts/audit-1000-final.json (필수)
    - scripts/audit-1000-results.json (선택, v3 비교용)

출력:
    - 콘솔에 분석 결과 출력
    - MATCHING_QUALITY_REPORT.md 자동 업데이트 (향후 구현)
"""

import json
import statistics
from collections import defaultdict, Counter
from typing import Dict, List, Any, Optional
from pathlib import Path


def load_audit_data(filepath: str) -> List[Dict]:
    """Audit 결과 파일 로드"""
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"파일 없음: {filepath}")

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"✓ 로드 완료: {filepath} ({len(data)} cases)")
    return data


def calculate_basic_stats(values: List[float]) -> Dict[str, float]:
    """기본 통계량 계산"""
    if not values or len(values) == 0:
        return {}

    sorted_values = sorted(values)
    n = len(values)

    stats = {
        'count': n,
        'mean': statistics.mean(values),
        'median': statistics.median(values),
        'min': min(values),
        'max': max(values),
    }

    if n > 1:
        stats['stdev'] = statistics.stdev(values)
        stats['variance'] = statistics.variance(values)

    if n >= 4:
        quantiles = statistics.quantiles(values, n=4)
        stats['q25'] = quantiles[0]
        stats['q75'] = quantiles[2]
        stats['iqr'] = quantiles[2] - quantiles[0]

    return stats


def analyze_score_distribution(data: List[Dict]) -> Dict[str, Any]:
    """스코어 분포 분석"""
    print("\n" + "="*60)
    print("1. 스코어 분포 분석")
    print("="*60)

    scores = [case['score'] for case in data if 'score' in case]
    if not scores:
        print("⚠️  스코어 데이터 없음")
        return {}

    stats = calculate_basic_stats(scores)

    print(f"\n📊 기본 통계량:")
    print(f"  - 케이스 수: {stats['count']}")
    print(f"  - 평균: {stats['mean']:.4f}")
    print(f"  - 중앙값: {stats['median']:.4f}")
    print(f"  - 표준편차: {stats.get('stdev', 0):.4f}")
    print(f"  - 최소값: {stats['min']:.4f}")
    print(f"  - 최대값: {stats['max']:.4f}")

    if 'q25' in stats:
        print(f"  - Q1 (25%): {stats['q25']:.4f}")
        print(f"  - Q3 (75%): {stats['q75']:.4f}")
        print(f"  - IQR: {stats['iqr']:.4f}")

    # 점수 구간 분포
    bins = [0, 0.15, 0.35, 0.55, 1.0]
    labels = ['< 0.15 (Hidden)', '0.15-0.35 (Exploratory)',
              '0.35-0.55 (Recommended)', '≥ 0.55 (Tailored)']

    distribution = Counter()
    for score in scores:
        for i, threshold in enumerate(bins[1:]):
            if score < threshold:
                distribution[labels[i]] += 1
                break

    print(f"\n📈 점수 구간 분포:")
    for label in labels:
        count = distribution[label]
        pct = (count / len(scores)) * 100
        print(f"  - {label}: {count}건 ({pct:.1f}%)")

    return {
        'stats': stats,
        'distribution': dict(distribution)
    }


def analyze_tier_distribution(data: List[Dict]) -> Dict[str, Any]:
    """Tier 분포 분석"""
    print("\n" + "="*60)
    print("2. Tier 분포 분석")
    print("="*60)

    tiers = [case['tier'] for case in data if 'tier' in case]
    if not tiers:
        print("⚠️  Tier 데이터 없음")
        return {}

    tier_counts = Counter(tiers)
    total = len(tiers)

    print(f"\n🎯 Tier 분포:")
    for tier in ['tailored', 'recommended', 'exploratory']:
        count = tier_counts.get(tier, 0)
        pct = (count / total) * 100
        print(f"  - {tier.capitalize()}: {count}건 ({pct:.1f}%)")

    return {
        'counts': dict(tier_counts),
        'total': total,
        'proportions': {k: v/total for k, v in tier_counts.items()}
    }


def analyze_dimension_contribution(data: List[Dict]) -> Dict[str, Any]:
    """차원별 기여도 분석"""
    print("\n" + "="*60)
    print("3. 차원별 기여도 분석")
    print("="*60)

    # 개인/사업자 구분
    personal_dimensions = ['region', 'age', 'householdType', 'incomeLevel', 'employmentStatus']
    business_dimensions = ['region', 'businessAge', 'businessType', 'employee', 'founderAge', 'revenue']

    dimension_scores: Dict[str, List[float]] = defaultdict(list)
    dimension_weights: Dict[str, float] = {}

    for case in data:
        if 'breakdown' not in case:
            continue

        breakdown = case['breakdown']
        for dim, score in breakdown.items():
            if isinstance(score, (int, float)):
                dimension_scores[dim].append(score)

    print(f"\n📊 차원별 평균 점수:")
    sorted_dims = sorted(dimension_scores.items(),
                        key=lambda x: statistics.mean(x[1]) if x[1] else 0,
                        reverse=True)

    for dim, scores in sorted_dims:
        if scores:
            avg = statistics.mean(scores)
            count = len(scores)
            print(f"  - {dim}: {avg:.4f} (n={count})")

    return {
        'dimension_scores': {k: calculate_basic_stats(v) for k, v in dimension_scores.items()}
    }


def analyze_knockout_effect(data: List[Dict]) -> Dict[str, Any]:
    """Knockout 효과 분석"""
    print("\n" + "="*60)
    print("4. Knockout 필터링 효과")
    print("="*60)

    total_analyzed = 0
    total_knocked_out = 0
    total_filtered_by_type = 0
    total_matched = 0

    for case in data:
        if 'totalAnalyzed' in case:
            total_analyzed += case['totalAnalyzed']
        if 'knockedOut' in case:
            total_knocked_out += case['knockedOut']
        if 'filteredByServiceType' in case:
            total_filtered_by_type += case['filteredByServiceType']
        if 'totalCount' in case:
            total_matched += case['totalCount']

    n_cases = len(data)
    if n_cases > 0:
        avg_analyzed = total_analyzed / n_cases
        avg_knocked_out = total_knocked_out / n_cases
        avg_filtered = total_filtered_by_type / n_cases
        avg_matched = total_matched / n_cases

        print(f"\n🔍 필터링 통계 (평균):")
        print(f"  - 분석 대상: {avg_analyzed:.1f}개")
        print(f"  - Service Type 필터: {avg_filtered:.1f}개 ({avg_filtered/avg_analyzed*100:.1f}%)")
        print(f"  - Knockout 제거: {avg_knocked_out:.1f}개 ({avg_knocked_out/avg_analyzed*100:.1f}%)")
        print(f"  - 최종 매칭: {avg_matched:.1f}개 ({avg_matched/avg_analyzed*100:.1f}%)")

        return {
            'avg_analyzed': avg_analyzed,
            'avg_knocked_out': avg_knocked_out,
            'avg_filtered': avg_filtered,
            'avg_matched': avg_matched,
            'knockout_rate': avg_knocked_out / avg_analyzed if avg_analyzed > 0 else 0
        }

    return {}


def compare_versions(v3_data: List[Dict], v4_data: List[Dict]) -> Dict[str, Any]:
    """v3 vs v4 비교 분석"""
    print("\n" + "="*60)
    print("5. v3 vs v4 비교 분석")
    print("="*60)

    v3_scores = [case['score'] for case in v3_data if 'score' in case]
    v4_scores = [case['score'] for case in v4_data if 'score' in case]

    if not v3_scores or not v4_scores:
        print("⚠️  비교 데이터 불충분")
        return {}

    if len(v3_scores) != len(v4_scores):
        print(f"⚠️  케이스 수 불일치: v3={len(v3_scores)}, v4={len(v4_scores)}")
        min_len = min(len(v3_scores), len(v4_scores))
        v3_scores = v3_scores[:min_len]
        v4_scores = v4_scores[:min_len]

    # 쌍체 차이
    diffs = [v4 - v3 for v3, v4 in zip(v3_scores, v4_scores)]

    v3_stats = calculate_basic_stats(v3_scores)
    v4_stats = calculate_basic_stats(v4_scores)
    diff_stats = calculate_basic_stats(diffs)

    print(f"\n📊 평균 점수 비교:")
    print(f"  - v3 평균: {v3_stats['mean']:.4f}")
    print(f"  - v4 평균: {v4_stats['mean']:.4f}")
    print(f"  - 차이 (Δ): {diff_stats['mean']:.4f}")
    print(f"  - 개선율: {(diff_stats['mean']/v3_stats['mean']*100):.1f}%")

    print(f"\n📊 중앙값 비교:")
    print(f"  - v3 중앙값: {v3_stats['median']:.4f}")
    print(f"  - v4 중앙값: {v4_stats['median']:.4f}")
    print(f"  - 차이: {v4_stats['median'] - v3_stats['median']:.4f}")

    # Cohen's d (pooled standard deviation)
    if 'stdev' in v3_stats and 'stdev' in v4_stats:
        n1, n2 = len(v3_scores), len(v4_scores)
        pooled_std = ((n1-1)*v3_stats['stdev']**2 + (n2-1)*v4_stats['stdev']**2) / (n1+n2-2)
        pooled_std = pooled_std ** 0.5

        cohens_d = (v4_stats['mean'] - v3_stats['mean']) / pooled_std

        effect_size = 'Negligible'
        if abs(cohens_d) >= 0.8:
            effect_size = 'Large'
        elif abs(cohens_d) >= 0.5:
            effect_size = 'Medium'
        elif abs(cohens_d) >= 0.2:
            effect_size = 'Small'

        print(f"\n📈 Effect Size (Cohen's d):")
        print(f"  - d = {cohens_d:.3f} ({effect_size})")

    # Tier 이동 분석
    v3_tiers = [case.get('tier') for case in v3_data]
    v4_tiers = [case.get('tier') for case in v4_data]

    if all(v3_tiers) and all(v4_tiers):
        upgrades = sum(1 for v3, v4 in zip(v3_tiers, v4_tiers)
                      if v3 == 'recommended' and v4 == 'tailored')
        downgrades = sum(1 for v3, v4 in zip(v3_tiers, v4_tiers)
                        if v3 == 'tailored' and v4 == 'recommended')

        print(f"\n🔄 Tier 이동:")
        print(f"  - Upgrade (recommended→tailored): {upgrades}건")
        print(f"  - Downgrade (tailored→recommended): {downgrades}건")
        print(f"  - Net Change: {upgrades - downgrades:+d}건")

    return {
        'v3_stats': v3_stats,
        'v4_stats': v4_stats,
        'diff_stats': diff_stats,
        'cohens_d': cohens_d if 'cohens_d' in locals() else None
    }


def main():
    """메인 분석 실행"""
    print("="*60)
    print("정부지원금 매칭 알고리즘 Audit 결과 분석")
    print("="*60)

    # v4 데이터 로드 (필수)
    try:
        v4_data = load_audit_data('scripts/audit-1000-final.json')
    except FileNotFoundError as e:
        print(f"\n❌ {e}")
        print("\n⏳ audit-1000-final.json 파일이 생성되면 다시 실행하세요.")
        return

    # v3 데이터 로드 (선택)
    v3_data = None
    try:
        v3_data = load_audit_data('scripts/audit-1000-results.json')
    except FileNotFoundError:
        print("ℹ️  v3 baseline 파일 없음 (비교 분석 건너뜀)")

    # 분석 실행
    score_analysis = analyze_score_distribution(v4_data)
    tier_analysis = analyze_tier_distribution(v4_data)
    dimension_analysis = analyze_dimension_contribution(v4_data)
    knockout_analysis = analyze_knockout_effect(v4_data)

    # v3 비교 (가능한 경우)
    if v3_data:
        comparison = compare_versions(v3_data, v4_data)

    # 요약
    print("\n" + "="*60)
    print("📋 분석 요약")
    print("="*60)

    if score_analysis and 'stats' in score_analysis:
        stats = score_analysis['stats']
        print(f"\n✓ 평균 매칭 스코어: {stats['mean']:.4f}")
        print(f"✓ 중앙값: {stats['median']:.4f}")

    if tier_analysis and 'proportions' in tier_analysis:
        props = tier_analysis['proportions']
        print(f"✓ Tailored 비율: {props.get('tailored', 0)*100:.1f}%")
        print(f"✓ Recommended 비율: {props.get('recommended', 0)*100:.1f}%")

    if knockout_analysis and 'knockout_rate' in knockout_analysis:
        print(f"✓ 평균 Knockout 비율: {knockout_analysis['knockout_rate']*100:.1f}%")

    print("\n" + "="*60)
    print("✅ 분석 완료")
    print("="*60)


if __name__ == '__main__':
    main()
