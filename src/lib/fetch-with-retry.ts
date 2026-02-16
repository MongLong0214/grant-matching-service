interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number
  baseDelayMs?: number
  timeoutMs?: number
}

/**
 * fetch wrapper with retry logic for government API calls.
 * - 5xx/timeout: retry up to 3 times with exponential backoff (1s, 2s, 4s)
 * - 4xx: fail immediately (client error, no point retrying)
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
