import { useCallback } from 'react'

import '../availability.css'

import { useLaguuniApi } from '../../../app/providers'
import type { BookingSlotSelection } from '../../../domain/booking'
import { getCableById } from '../../../domain/cable'
import { useBookingFlow } from '../../booking/use-booking-flow'
import { useAvailabilityOverview } from '../use-availability-overview'
import { useAvailabilityScope } from '../use-availability-scope'
import { AvailabilityBookingStatus } from './AvailabilityBookingStatus'
import { AvailabilityCableSelector } from './AvailabilityCableSelector'
import { AvailabilityOverviewContent } from './AvailabilityOverviewContent'

type AvailabilityScreenProps = {
  isActive: boolean
}

export function AvailabilityScreen({ isActive }: AvailabilityScreenProps) {
  const api = useLaguuniApi()
  const { selectedCable, selectCable } = useAvailabilityScope()
  const activeCable = getCableById(selectedCable)
  const availabilityState = useAvailabilityOverview(api, selectedCable)
  const { bookSelection, bookingState, isBookingInProgress, traceId } =
    useBookingFlow()
  const handleBookSelection = useCallback(
    (selection: BookingSlotSelection) => {
      void bookSelection(selection)
    },
    [bookSelection],
  )

  return (
    <section
      className="screen-card"
      aria-labelledby="availability-title"
      hidden={!isActive}
    >
      <header className="screen-header">
        <p className="screen-kicker">Availability overview</p>
        <h2 id="availability-title" className="screen-title">
          Book a one-hour cable slot
        </h2>
        <p className="screen-copy">
          Browse mocked storefront availability grouped by date and book the
          selected one-hour slot with your locally saved checkout details.
        </p>
      </header>

      <AvailabilityBookingStatus
        bookingState={bookingState}
        traceId={traceId}
      />

      <AvailabilityCableSelector
        onSelectCable={selectCable}
        selectedCable={selectedCable}
      />

      <AvailabilityOverviewContent
        activeCableLabel={activeCable.label}
        availabilityState={availabilityState}
        onBookSelection={isBookingInProgress ? undefined : handleBookSelection}
      />

      <p className="screen-note">
        Current cable: <strong>{activeCable.label}</strong> (product{' '}
        <strong>{activeCable.productId}</strong>)
      </p>
    </section>
  )
}
