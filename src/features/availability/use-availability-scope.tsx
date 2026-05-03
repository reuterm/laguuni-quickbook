import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react'

import { type CableId, DEFAULT_CABLE_ID } from '../../domain/cable'
import { useUserSettings } from '../settings/use-user-settings'

type AvailabilityScope = {
  selectCable: (cableId: CableId) => void
  selectedCable: CableId
}

const AvailabilityScopeContext = createContext<AvailabilityScope | null>(null)

export function AvailabilityScopeProvider({ children }: PropsWithChildren) {
  const { settings } = useUserSettings()
  const [selectedCable, setSelectedCable] = useState<CableId>(
    () => settings.defaultCable ?? DEFAULT_CABLE_ID,
  )

  const value = useMemo<AvailabilityScope>(
    () => ({
      selectCable: setSelectedCable,
      selectedCable,
    }),
    [selectedCable],
  )

  return (
    <AvailabilityScopeContext.Provider value={value}>
      {children}
    </AvailabilityScopeContext.Provider>
  )
}

export function useAvailabilityScope(): AvailabilityScope {
  const availabilityScope = useContext(AvailabilityScopeContext)

  if (availabilityScope === null) {
    throw new Error(
      'Availability scope must be used within AvailabilityScopeProvider',
    )
  }

  return availabilityScope
}
