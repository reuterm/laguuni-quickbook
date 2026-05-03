import type { BookingSlotSelection } from '../../../domain/booking'
import type { AvailabilityState } from '../use-availability-overview'
import { AvailabilityDayGroups } from './AvailabilityDayGroups'

type AvailabilityOverviewContentProps = {
  activeCableLabel: string
  availabilityState: AvailabilityState
  onBookSelection?: ((selection: BookingSlotSelection) => void) | undefined
}

export function AvailabilityOverviewContent({
  activeCableLabel,
  availabilityState,
  onBookSelection,
}: AvailabilityOverviewContentProps) {
  if (availabilityState.status === 'loading') {
    return <p className="availability-status">Loading mocked availability…</p>
  }

  if (availabilityState.status === 'error') {
    return (
      <div className="empty-state" role="alert">
        <h3 className="day-group__title">Availability unavailable</h3>
        <p className="screen-copy">{availabilityState.message}</p>
      </div>
    )
  }

  if (availabilityState.dayGroups.length === 0) {
    return (
      <div className="empty-state">
        <h3 className="day-group__title">No bookable slots in range</h3>
        <p className="screen-copy">
          No bookable one-hour slots are available for {activeCableLabel} in the
          loaded range.
        </p>
      </div>
    )
  }

  return (
    <AvailabilityDayGroups
      dayGroups={availabilityState.dayGroups}
      onBookSelection={onBookSelection}
    />
  )
}
