import { X } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTitle } from '@/components/ui/alert-title'
import { Button } from '@/components/ui/button'
import { ContentRail } from '@/components/ui/content-rail'
import {
  eyebrowClassName,
  subtleSurfaceBackgroundClassName,
} from '@/components/ui/styles'
import { cn } from '@/lib/utils'
import {
  useAvailabilityReferenceDate,
  useBrowserStorage,
  useDiagnostics,
  useLaguuniApi,
} from '../../../app/providers'
import { getCableById } from '../../../domain/cable'
import { BookingSheetFlow } from '../../booking/components/BookingSheetFlow'
import { useBookingSheetController } from '../../booking/use-booking-sheet-controller'
import { exportDiagnosticsForTrace } from '../../diagnostics/export'
import {
  loadReadOnlyNoticeDismissed,
  saveReadOnlyNoticeDismissed,
} from '../read-only-notice-storage'
import { useAvailabilityOverview } from '../use-availability-overview'
import { useAvailabilityScope } from '../use-availability-scope'
import { AvailabilityCableSelector } from './AvailabilityCableSelector'
import { AvailabilityOverviewContent } from './AvailabilityOverviewContent'
import { getAvailabilityBookingActionProps } from './availability-booking-action'

type AvailabilityScreenProps = {
  isOnline: boolean
  onOpenSettings: () => void
}

export function AvailabilityScreen({
  isOnline,
  onOpenSettings,
}: AvailabilityScreenProps) {
  const api = useLaguuniApi()
  const storage = useBrowserStorage()
  const diagnostics = useDiagnostics()
  const availabilityReferenceDate = useAvailabilityReferenceDate()
  const [isReadOnlyNoticeDismissed, setIsReadOnlyNoticeDismissed] = useState(
    () => loadReadOnlyNoticeDismissed(storage),
  )
  const { selectedCable, selectCable } = useAvailabilityScope()
  const activeCable = getCableById(selectedCable)
  const { availabilityState, loadMoreAvailability, refreshAvailabilityDay } =
    useAvailabilityOverview(api, selectedCable, availabilityReferenceDate, {
      enabled: isOnline,
    })
  const handleExportTrace = useCallback(
    async (traceId: string) => {
      await exportDiagnosticsForTrace(
        (options) => diagnostics.exportLogs(options),
        traceId,
      )
    },
    [diagnostics],
  )
  const {
    bookingSheetState,
    confirmBooking,
    dismissBookingSheet,
    isBookingInProgress,
    isBookingReady,
    requestBooking,
  } = useBookingSheetController({
    onBookingFinalized: async ({ selection }) => {
      await refreshAvailabilityDay(selection.date)
    },
  })

  const handleDismissReadOnlyNotice = useCallback(() => {
    saveReadOnlyNoticeDismissed(true, storage)
    setIsReadOnlyNoticeDismissed(true)
  }, [storage])
  const showReadOnlyNotice =
    isOnline && !isBookingReady && !isReadOnlyNoticeDismissed
  const bookingActionProps = getAvailabilityBookingActionProps(
    isBookingReady,
    isBookingInProgress,
    requestBooking,
  )

  return (
    <section aria-labelledby="availability-title" className="space-y-6">
      <ContentRail className="space-y-5">
        <BookingSheetFlow
          bookingSheetState={bookingSheetState}
          confirmBooking={confirmBooking}
          dismissBookingSheet={dismissBookingSheet}
          onExportTrace={handleExportTrace}
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
      </ContentRail>

      <div className="space-y-4">
        <AvailabilityOverviewContent
          activeCableLabel={activeCable.label}
          availabilityState={availabilityState}
          isOffline={!isOnline}
          onLoadMore={loadMoreAvailability}
          {...bookingActionProps}
        />
      </div>
    </section>
  )
}
