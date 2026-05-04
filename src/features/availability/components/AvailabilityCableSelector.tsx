import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  type CableId,
  isCableId,
  SUPPORTED_CABLES,
} from '../../../domain/cable'

type AvailabilityCableSelectorProps = {
  onSelectCable: (cableId: CableId) => void
  selectedCable: CableId
}

export function AvailabilityCableSelector({
  onSelectCable,
  selectedCable,
}: AvailabilityCableSelectorProps) {
  function handleValueChange(nextCableId: string) {
    if (isCableId(nextCableId)) {
      onSelectCable(nextCableId)
    }
  }

  return (
    <Tabs
      value={selectedCable}
      onValueChange={handleValueChange}
      className="w-full"
    >
      <TabsList
        aria-label="Supported cables"
        className="grid h-auto w-full"
        style={{
          gridTemplateColumns: `repeat(${SUPPORTED_CABLES.length}, minmax(0, 1fr))`,
        }}
      >
        {SUPPORTED_CABLES.map((cable) => (
          <TabsTrigger
            key={cable.id}
            value={cable.id}
            className="min-h-10 px-4 py-2 text-center"
          >
            <span className="font-medium">{cable.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
