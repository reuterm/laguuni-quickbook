import '../availability.css'

import { useAppServices } from '../../../app/providers'
import {
  type CableId,
  getCableById,
  SUPPORTED_CABLES,
} from '../../../domain/cable'
import { useAvailabilityOverview } from '../use-availability-overview'
import { AvailabilityDayGroups } from './AvailabilityDayGroups'

type AvailabilityScreenProps = {
  selectedCable: CableId
  onSelectCable: (cableId: CableId) => void
}

export function AvailabilityScreen({
  selectedCable,
  onSelectCable,
}: AvailabilityScreenProps) {
  const { api } = useAppServices()
  const activeCable = getCableById(selectedCable)
  const availabilityState = useAvailabilityOverview(api, selectedCable)

  return (
    <section className="screen-card" aria-labelledby="availability-title">
      <header className="screen-header">
        <p className="screen-kicker">Availability overview</p>
        <h2 id="availability-title" className="screen-title">
          Book a one-hour cable slot
        </h2>
        <p className="screen-copy">
          Browse mocked storefront availability grouped by date. Booking actions
          stay visible here, while the booking flow itself lands in phase 7.
        </p>
      </header>

      <fieldset className="cable-switch">
        <legend className="screen-kicker">Supported cables</legend>
        {SUPPORTED_CABLES.map((cable) => (
          <button
            key={cable.id}
            type="button"
            className={`cable-button${
              selectedCable === cable.id ? ' cable-button--active' : ''
            }`}
            onClick={() => onSelectCable(cable.id)}
            aria-pressed={selectedCable === cable.id}
          >
            {cable.label}
          </button>
        ))}
      </fieldset>

      {availabilityState.status === 'loading' ? (
        <p className="availability-status">Loading mocked availability…</p>
      ) : availabilityState.status === 'error' ? (
        <div className="empty-state" role="alert">
          <h3 className="day-group__title">Availability unavailable</h3>
          <p className="screen-copy">{availabilityState.message}</p>
        </div>
      ) : availabilityState.dayGroups.length === 0 ? (
        <div className="empty-state">
          <h3 className="day-group__title">No bookable slots in range</h3>
          <p className="screen-copy">
            No bookable one-hour slots are available for {activeCable.label} in
            the loaded range.
          </p>
        </div>
      ) : (
        <AvailabilityDayGroups dayGroups={availabilityState.dayGroups} />
      )}

      <p className="screen-note">
        Current cable: <strong>{activeCable.label}</strong> (product{' '}
        <strong>{activeCable.productId}</strong>)
      </p>
    </section>
  )
}
