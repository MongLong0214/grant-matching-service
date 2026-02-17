#!/bin/bash
# 정부지원금 매칭 Audit 파일 자동 감시 및 분석 스크립트
#
# 사용법:
#   chmod +x scripts/watch-audit-files.sh
#   ./scripts/watch-audit-files.sh
#
# 동작:
#   - scripts/audit-1000-final.json 파일 생성 감지
#   - 생성 시 자동으로 analyze-audit-results.py 실행
#   - 분석 결과를 콘솔에 출력

set -e

WATCH_FILE="scripts/audit-1000-final.json"
ANALYSIS_SCRIPT="scripts/analyze-audit-results.py"
CHECK_INTERVAL=5  # seconds

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Audit 파일 감시 시작"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "감시 대상: $WATCH_FILE"
echo "분석 스크립트: $ANALYSIS_SCRIPT"
echo "체크 주기: ${CHECK_INTERVAL}초"
echo ""
echo "⏳ 파일 생성을 기다리는 중... (Ctrl+C로 중단)"
echo ""

# 파일이 이미 존재하는지 확인
if [ -f "$WATCH_FILE" ]; then
    echo "✓ 파일 발견! 즉시 분석 시작..."
    echo ""
    python3 "$ANALYSIS_SCRIPT"
    exit 0
fi

# 파일 생성 대기
while true; do
    if [ -f "$WATCH_FILE" ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ 파일 생성 감지!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""

        # 파일 쓰기 완료 대기 (1초)
        sleep 1

        # 분석 실행
        python3 "$ANALYSIS_SCRIPT"

        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ 분석 완료. 감시 종료."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        break
    fi

    # 점 하나 출력 (진행 표시)
    echo -n "."
    sleep "$CHECK_INTERVAL"
done
