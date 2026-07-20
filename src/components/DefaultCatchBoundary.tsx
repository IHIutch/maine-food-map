import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { button, eyebrow } from './ui'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  })

  console.error('DefaultCatchBoundary Error:', error)

  return (
    <div className="min-w-0 flex-1 px-6 py-16 flex flex-col items-center justify-center gap-6">
      <p className={eyebrow({ bar: true })}>Something went wrong</p>
      <ErrorComponent error={error} />
      <div className="flex gap-3 items-center flex-wrap">
        <button
          onClick={() => {
            router.invalidate()
          }}
          className={button({ intent: 'primary' })}
        >
          Try Again
        </button>
        {isRoot ? (
          <Link
            to="/"
            className={button({ intent: 'secondary' })}
          >
            Home
          </Link>
        ) : (
          <Link
            to="/"
            className={button({ intent: 'secondary' })}
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
