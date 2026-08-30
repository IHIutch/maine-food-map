/** PROTOTYPE — tiny shared render helper. Layout is deliberately NOT shared. */
import { highlight } from './search-core'

export function Marked({ text, query }: { text: string, query: string }) {
  return (
    <>
      {highlight(text, query).map((run, index) =>
        run.hit
          ? <mark key={index} className="rounded-[3px] bg-accent/30 px-px text-ink">{run.text}</mark>
          : <span key={index}>{run.text}</span>,
      )}
    </>
  )
}
