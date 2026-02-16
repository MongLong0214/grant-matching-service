"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <svg
                className="h-10 w-10 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            오류가 발생했습니다
          </h1>
          <p className="mb-8 text-gray-600">
            예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
          </p>

          <button
            onClick={reset}
            className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
