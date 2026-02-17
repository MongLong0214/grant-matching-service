interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number
  baseDelayMs?: number
  timeoutMs?: number
}

/**
 * 공공 API 호출용 재시도 fetch 래퍼
 * @param url - 요청 URL
 * @param options - 재시도 횟수, 딜레이, 타임아웃 포함 옵션
 * @returns 응답 객체
 *
 * - 5xx/타임아웃: 최대 3회 지수 백오프 재시도 (1s, 2s, 4s)
 * - 4xx: 즉시 반환 (클라이언트 에러는 재시도 무의미)
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { maxRetries = 3, baseDelayMs = 1000, timeoutMs = 30000, ...fetchOptions } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      // 4xx: 클라이언트 에러는 재시도 불필요
      if (response.status >= 400 && response.status < 500) {
        return response
      }

      // 5xx: 서버 에러는 재시도
      if (response.status >= 500) {
        lastError = new Error(`Server error: ${response.status} ${response.statusText}`)
        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt)
          await sleep(delay)
          continue
        }
        return response
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // AbortError = timeout, 재시도 대상
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        await sleep(delay)
        continue
      }
    }
  }

  throw lastError ?? new Error('fetchWithRetry: all retries exhausted')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
