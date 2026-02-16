// [DISABLED] 중소기업기술정보진흥원_중소벤처24 공고정보
// data.go.kr에서 LINK 유형 API로 분류되어 REST 엔드포인트가 존재하지 않음.
// apis.data.go.kr/B552940/smeVenture24AnnoInfo/getAnnoList 엔드포인트는 실제로 동작하지 않음.
// REST API가 제공될 경우 이 파일을 재활성화할 것.

export async function syncSmeVenture24(): Promise<{
  fetched: number
  inserted: number
  updated: number
  skipped: number
  apiCallsUsed: number
}> {
  console.log('[SmeVenture24] LINK 유형 API - REST 엔드포인트 미제공, 동기화 건너뜀')
  return { fetched: 0, inserted: 0, updated: 0, skipped: 0, apiCallsUsed: 0 }
}
