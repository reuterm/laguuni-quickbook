import { X } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import {
  eyebrowClassName,
  subtleSurfaceBackgroundClassName,
} from '@/components/ui/styles'
import { cn } from '@/lib/utils'
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
import { getAvailabilityBookingActionProps } from './availability-booking-action'

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
  const bookingActionProps = getAvailabilityBookingActionProps(
    isBookingReady,
    isBookingInProgress,
    handleBookSelection,
  )

  return (
    <section aria-labelledby="availability-title" className="space-y-6">
      <div className="space-y-5">
        <SectionHeader
          eyebrow="Availability"
          badge={
            <Badge size="eyebrow" variant="subtle">
              One rider · One hour
            </Badge>
          }
          titleId="availability-title"
          title="Book a one-hour cable slot"
          titleAs="h2"
          titleClassName="text-2xl sm:text-[2rem]"
          description="Choose a cable, scan the next seven days, and book the slot you want."
          descriptionClassName="max-w-3xl sm:text-base"
          contentClassName="space-y-2"
        />

        <AvailabilityBookingStatus
          bookingState={bookingState}
          traceId={traceId}
        />

        {showReadOnlyNotice ? (
          <Alert
            role="status"
            className={cn('gap-4', subtleSurfaceBackgroundClassName)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <AlertTitle>
                  Browse first, add details only when you want to book
                </AlertTitle>
                <AlertDescription>
                  Save your name, phone, and email in Settings to reveal booking
                  actions. Those details stay only in this browser. If you would
                  rather not store them, you can keep using the app in read-only
                  mode.
                </AlertDescription>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="-mr-2 -mt-2 size-8 shrink-0 rounded-full"
                aria-label="Dismiss notice"
                onClick={handleDismissReadOnlyNotice}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                size="sm"
                className="w-full sm:w-auto"
                onClick={onOpenSettings}
              >
                Add booking details
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                Booking details stay local and are never required for browsing.
              </p>
            </div>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <p id="availability-cable-label" className={eyebrowClassName}>
            Cable
          </p>
          <AvailabilityCableSelector
            ariaLabelledBy="availability-cable-label"
            onSelectCable={selectCable}
            selectedCable={selectedCable}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-end px-1">
          <p className={eyebrowClassName}>Next 7 days</p>
        </div>

        <AvailabilityOverviewContent
          activeCableLabel={activeCable.label}
          availabilityState={availabilityState}
          {...bookingActionProps}
        />
      </div>
    </section>
  )
}
