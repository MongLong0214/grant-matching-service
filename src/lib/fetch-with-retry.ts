interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number
  baseDelayMs?: number
  timeoutMs?: number
  retry429?: boolean  // 429 재시도 여부 (기본 false — 쿼터형 API는 재시도 무의미)
}

/**
 * 공공 API 호출용 재시도 fetch 래퍼
 * @param url - 요청 URL
 * @param options - 재시도 횟수, 딜레이, 타임아웃 포함 옵션
 * @returns 응답 객체
 *
 * - 5xx/타임아웃: 최대 3회 지수 백오프 재시도 (1s, 2s, 4s)
 * - 429: 기본 즉시 반환 (retry429: true 시 최대 3회 재시도)
 * - 4xx: 즉시 반환 (클라이언트 에러는 재시도 무의미)
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { maxRetries = 3, baseDelayMs = 1000, timeoutMs = 30000, retry429 = false, ...fetchOptions } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      clearTimeout(timer)

      // 429: 쿼터 초과 — retry429 옵션에 따라 재시도 또는 즉시 반환
      if (response.status === 429) {
        if (retry429 && attempt < maxRetries) {
          const delay = parseRetryAfter(response, baseDelayMs, attempt)
          await sleep(delay)
          continue
        }
        return response
      }

      // 4xx: 클라이언트 에러는 재시도 불필요
      if (response.status >= 400 && response.status < 500) {
        return response
      }

      // 5xx: 서버 에러는 재시도
      if (response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt)
          await sleep(delay)
          continue
        }
        return response
      }

      return response
    } catch (error) {
      clearTimeout(timer)
      lastError = error instanceof Error ? error : new Error(String(error))

      // 타임아웃/네트워크 에러: 재시도 대상
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        await sleep(delay)
        continue
      }
    }
  }

  throw lastError ?? new Error('fetchWithRetry: all retries exhausted')
}

// 429 응답의 Retry-After 헤더 파싱 → 대기 시간(ms) 반환
// Retry-After 없으면 5xx보다 3배 긴 백오프 적용 (쿼터 초과는 더 긴 대기 필요)
function parseRetryAfter(response: Response, baseDelayMs: number, attempt: number): number {
  const RATE_LIMIT_MULTIPLIER = 3
  const fallback = baseDelayMs * RATE_LIMIT_MULTIPLIER * Math.pow(2, attempt)

  const header = response.headers.get('Retry-After')
  if (!header) return fallback

  // 정수형 (초 단위)
  const seconds = parseInt(header, 10)
  if (!isNaN(seconds)) return Math.max(seconds * 1000, baseDelayMs)

  // HTTP-date 형식 (유효하지 않은 날짜 → fallback)
  const retryDate = new Date(header).getTime()
  if (isNaN(retryDate)) return fallback
  const waitMs = retryDate - Date.now()
  return waitMs > 0 ? waitMs : fallback
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
