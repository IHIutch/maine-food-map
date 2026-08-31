/** PROTOTYPE — floating variant switcher. Hidden in production builds. */
import { useEffect } from 'react'

export default function PrototypeSwitcher<T extends string>({ variants, current, names, onChange }: {
  variants: readonly T[]
  current: T
  names: Record<T, string>
  onChange: (variant: T) => void
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable))
        return
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
        return
      const index = variants.indexOf(current)
      onChange(variants[(index + (event.key === 'ArrowRight' ? 1 : variants.length - 1)) % variants.length]!)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [variants, current, onChange])

  if (import.meta.env.PROD)
    return null

  const index = variants.indexOf(current)
  const step = (delta: number) => onChange(variants[(index + delta + variants.length) % variants.length]!)

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-1 rounded-full bg-fuchsia-600 p-1.5 font-mono text-[12px] text-white shadow-2xl ring-2 shadow-black/40 ring-white/70">
      <button type="button" onClick={() => step(-1)} className="cursor-pointer rounded-full px-2.5 py-1 hover:bg-black/20" aria-label="Previous variant">←</button>
      <span className="px-2 whitespace-nowrap">
        {current}
        {' — '}
        {names[current]}
      </span>
      <button type="button" onClick={() => step(1)} className="cursor-pointer rounded-full px-2.5 py-1 hover:bg-black/20" aria-label="Next variant">→</button>
    </div>
  )
}
