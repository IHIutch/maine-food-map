import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  })

  console.error('DefaultCatchBoundary Error:', error)

  return (
    <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
      <ErrorComponent error={error} />
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => {
            router.invalidate()
          }}
          className="rounded-full bg-pine px-5 py-2.5 text-sm font-medium text-paper hover:bg-pine-deep transition-colors"
        >
          Try Again
        </button>
        {isRoot ? (
          <Link
            to="/"
            className="rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-cream transition-colors"
          >
            Home
          </Link>
        ) : (
          <Link
            to="/"
            className="rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-cream transition-colors"
            onClick={(e) => {
              e.preventDefault()
              window.history.back()
            }}
          >
            Go Back
          </Link>
        )}
      </div>
    </div>
  )
}
