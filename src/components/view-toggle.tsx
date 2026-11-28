/**
 * Map ⇄ list switch. The two views compete for the whole screen on a phone, so
 * only one shows at a time and this picks which; from lg they sit side by side
 * and the filter bar drops it.
 *
 * Ark's ToggleGroup carries the roving tabindex and arrow-key navigation, so the
 * pair behaves as one stop in the tab order rather than two buttons.
 */
import { ToggleGroup } from '@ark-ui/react/toggle-group'

import { segmented, segmentedItem } from './ui'

const OPTIONS = [
  { value: 'list', label: 'List', icon: 'icon-[material-symbols--list-rounded]' },
  { value: 'map', label: 'Map', icon: 'icon-[material-symbols--map-rounded]' },
] as const

export default function ViewToggle({ view, onChange }: {
  view: 'list' | 'map'
  onChange: (next: 'list' | 'map') => void
}) {
  return (
    <ToggleGroup.Root
      className={segmented()}
      value={[view]}
      // a view is always chosen, so the current one can't be toggled off
      deselectable={false}
      onValueChange={(details) => {
        const next = details.value[0]
        if (next === 'list' || next === 'map')
          onChange(next)
      }}
      aria-label="Choose list or map"
    >
      {OPTIONS.map(option => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className={segmentedItem({ active: view === option.value })}
        >
          <span className={`size-4 ${option.icon}`} />
          {/* Show the label only for the selected view. */}
          {view === option.value ? option.label : <span className="sr-only">{option.label}</span>}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
