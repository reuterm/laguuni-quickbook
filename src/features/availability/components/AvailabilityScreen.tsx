import { useCallback } from 'react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  useAvailabilityReferenceDate,
  useLaguuniApi,
} from '../../../app/providers'
import type { BookingSlotSelection } from '../../../domain/booking'
import { getCableById } from '../../../domain/cable'
import { useBookingFlow } from '../../booking/use-booking-flow'
import { useAvailabilityOverview } from '../use-availability-overview'
import { useAvailabilityScope } from '../use-availability-scope'
import { AvailabilityBookingStatus } from './AvailabilityBookingStatus'
import { AvailabilityCableSelector } from './AvailabilityCableSelector'
import { AvailabilityOverviewContent } from './AvailabilityOverviewContent'

export function AvailabilityScreen() {
  const api = useLaguuniApi()
  const availabilityReferenceDate = useAvailabilityReferenceDate()
  const { selectedCable, selectCable } = useAvailabilityScope()
  const activeCable = getCableById(selectedCable)
  const availabilityState = useAvailabilityOverview(
    api,
    selectedCable,
    availabilityReferenceDate,
  )
  const {
    bookSelection,
    bookingState,
    isBookingInProgress,
    isBookingReady,
    traceId,
  } = useBookingFlow()
  const handleBookSelection = useCallback(
    (selection: BookingSlotSelection) => {
      void bookSelection(selection)
    },
    [bookSelection],
  )

  return (
    <section aria-labelledby="availability-title">
      <Card className="overflow-hidden">
        <CardHeader className="space-y-4 border-b border-border/70">
          <div className="space-y-2">
            <h2
              id="availability-title"
              className="text-balance text-2xl font-semibold tracking-tight"
            >
              Book a one-hour cable slot
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Choose a cable, scan the next seven days, and book the slot you
              want.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">One rider · One hour</p>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          <AvailabilityBookingStatus
            bookingState={bookingState}
            traceId={traceId}
          />

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Cable
            </p>
            <AvailabilityCableSelector
              onSelectCable={selectCable}
              selectedCable={selectedCable}
            />
          </div>

          <AvailabilityOverviewContent
            activeCableLabel={activeCable.label}
            availabilityState={availabilityState}
            showBookingActions={isBookingReady}
            onBookSelection={
              isBookingInProgress ? undefined : handleBookSelection
            }
          />
        </CardContent>
      </Card>
    </section>
  )
}
