import { useRouter } from '@tanstack/react-router'
import { useState, useTransition } from 'react'
import { trackEvent } from 'fathom-client'
import { useServerFn } from '@tanstack/react-start'
import { tv } from 'tailwind-variants'
import { likeRestaurant, unlikeRestaurant } from '../server/likes'

const likePill = tv({
  base: 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition',
  variants: {
    liked: {
      true: 'border-tomato/30 bg-tomato-tint text-tomato hover:bg-tomato-tint/70',
      false: 'border-ink/15 bg-white text-ink hover:bg-cream',
    },
    pending: {
      true: 'opacity-70',
    },
  },
})

type Props = {
  publicId: string
  slug: string
  initialTotal: number
  initialLiked: boolean
  isAuthenticated: boolean
}

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact' })

export function LikeButton({
  publicId,
  slug,
  initialTotal,
  initialLiked,
  isAuthenticated,
}: Props) {
  const router = useRouter()
  const like = useServerFn(likeRestaurant)
  const unlike = useServerFn(unlikeRestaurant)
  const [liked, setLiked] = useState(initialLiked)
  const [total, setTotal] = useState(initialTotal)
  const [isPending, startTransition] = useTransition()

  if (!isAuthenticated) {
    return (
      <a
        href={`/login?next=${encodeURIComponent(`/places/${slug}`)}`}
        title="Sign in with Bluesky to like"
        className={likePill({ liked: false })}
      >
        <HeartIcon filled={false} />
        <span>{compactNumber.format(total)}</span>
      </a>
    )
  }

  const onClick = () => {
    const nextLiked = !liked
    const nextTotal = total + (nextLiked ? 1 : -1)
    setLiked(nextLiked)
    setTotal(Math.max(nextTotal, 0))
    trackEvent(`${nextLiked ? 'like' : 'unlike'}: ${slug}`)

    startTransition(async () => {
      try {
        const res = nextLiked
          ? await like({ data: { publicId } })
          : await unlike({ data: { publicId } })
        setLiked(res.userHasLiked)
        setTotal(res.totalLikes)
        router.invalidate()
      } catch {
        setLiked(liked)
        setTotal(total)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={liked}
      className={likePill({ liked, pending: isPending })}
    >
      <HeartIcon filled={liked} />
      <span>{compactNumber.format(total)}</span>
    </button>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
