import { X } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  useAvailabilityReferenceDate,
  useLaguuniApi,
} from '../../../app/providers'
import type { BookingSlotSelection } from '../../../domain/booking'
import { getCableById } from '../../../domain/cable'
import { useBookingFlow } from '../../booking/use-booking-flow'
import {
  loadReadOnlyNoticeDismissed,
  saveReadOnlyNoticeDismissed,
} from '../read-only-notice-storage'
import { useAvailabilityOverview } from '../use-availability-overview'
import { useAvailabilityScope } from '../use-availability-scope'
import { AvailabilityBookingStatus } from './AvailabilityBookingStatus'
import { AvailabilityCableSelector } from './AvailabilityCableSelector'
import { AvailabilityOverviewContent } from './AvailabilityOverviewContent'

type AvailabilityScreenProps = {
  onOpenSettings: () => void
}

export function AvailabilityScreen({
  onOpenSettings,
}: AvailabilityScreenProps) {
  const api = useLaguuniApi()
  const availabilityReferenceDate = useAvailabilityReferenceDate()
  const [isReadOnlyNoticeDismissed, setIsReadOnlyNoticeDismissed] = useState(
    () => loadReadOnlyNoticeDismissed(),
  )
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
  const handleDismissReadOnlyNotice = useCallback(() => {
    saveReadOnlyNoticeDismissed(true)
    setIsReadOnlyNoticeDismissed(true)
  }, [])
  const showReadOnlyNotice = !isBookingReady && !isReadOnlyNoticeDismissed

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

          {showReadOnlyNotice ? (
            <Alert role="status" className="gap-3 border-border/70 bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <AlertTitle>
                  Browse availability first, add details only if you want to
                  book
                </AlertTitle>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="-mr-2 -mt-2 size-8 shrink-0"
                  aria-label="Dismiss notice"
                  onClick={handleDismissReadOnlyNotice}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <AlertDescription>
                  Save your name, phone, and email in Settings to reveal booking
                  actions. Those details stay only in this browser. If you would
                  rather not store them, you can keep using the app in read-only
                  mode.
                </AlertDescription>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={onOpenSettings}
                >
                  Add booking details
                </Button>
              </div>
            </Alert>
          ) : null}

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
