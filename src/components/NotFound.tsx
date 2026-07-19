import { Link } from '@tanstack/react-router'
import { button } from './ui'

export function NotFound({ children }: { children?: any }) {
  return (
    <div className="space-y-2 rounded-2xl bg-white ring-1 ring-ink/10 p-8">
      <div className="text-ink-soft">
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => window.history.back()}
          className={button({ intent: 'primary' })}
        >
          Go back
        </button>
        <Link
          to="/"
          className={button({ intent: 'secondary' })}
        >
          Start Over
        </Link>
      </p>
    </div>
  )
}
