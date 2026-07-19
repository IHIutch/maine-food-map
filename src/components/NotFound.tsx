import { Link } from '@tanstack/react-router'

export function NotFound({ children }: { children?: any }) {
  return (
    <div className="space-y-2 rounded-2xl bg-white ring-1 ring-ink/10 p-8">
      <div className="text-ink-soft">
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => window.history.back()}
          className="rounded-full bg-pine px-5 py-2.5 text-sm font-medium text-paper hover:bg-pine-deep transition-colors"
        >
          Go back
        </button>
        <Link
          to="/"
          className="rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-cream transition-colors"
        >
          Start Over
        </Link>
      </p>
    </div>
  )
}
