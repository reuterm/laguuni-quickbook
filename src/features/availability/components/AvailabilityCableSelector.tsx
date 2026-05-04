import {
  SegmentedControl,
  type SegmentedControlItem,
} from '@/components/ui/segmented-control'

import { type CableId, SUPPORTED_CABLES } from '../../../domain/cable'

const cableItems = SUPPORTED_CABLES.map((cable) => ({
  label: cable.label,
  value: cable.id,
})) satisfies readonly SegmentedControlItem<CableId>[]

type AvailabilityCableSelectorProps = {
  ariaLabelledBy?: string
  onSelectCable: (cableId: CableId) => void
  selectedCable: CableId
}

export function AvailabilityCableSelector({
  ariaLabelledBy,
  onSelectCable,
  selectedCable,
}: AvailabilityCableSelectorProps) {
  return (
    <SegmentedControl
      items={cableItems}
      value={selectedCable}
      onValueChange={onSelectCable}
      {...(ariaLabelledBy !== undefined
        ? { ariaLabelledBy }
        : { ariaLabel: 'Supported cables' })}
    />
  )
}
