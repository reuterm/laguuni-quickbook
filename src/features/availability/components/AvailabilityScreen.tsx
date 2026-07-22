import { X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

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
  useDiagnostics,
  useLaguuniApi,
  useReadOnlyNoticeStore,
} from '../../../app/providers'
import { getCableById } from '../../../domain/cable'
import { getBookingSlotSelectionKey } from '../../booking/booking-selections'
import { BookingSheetFlow } from '../../booking/components/BookingSheetFlow'
import { useBookingSheetController } from '../../booking/use-booking-sheet-controller'
import { exportDiagnosticsForTrace } from '../../diagnostics/export'
import { useAvailabilityOverview } from '../use-availability-overview'
import { useAvailabilityScope } from '../use-availability-scope'
import { useBookingBasket } from '../use-booking-basket'
import { AvailabilityCableSelector } from './AvailabilityCableSelector'
import { AvailabilityOverviewContent } from './AvailabilityOverviewContent'
import { getAvailabilityBookingActionProps } from './availability-booking-action'
import { BookingBasketReviewButton } from './BookingBasketReviewButton'
import { BookingReplacementSheet } from './BookingReplacementSheet'
import { emptyBookingBasket } from './booking-basket-props'
import {
  getSelectionForDate,
  type PendingBookingReplacement,
} from '../booking-replacement'

type AvailabilityScreenProps = {
  isOnline: boolean
  onOpenSettings: () => void
}

export function AvailabilityScreen({
  isOnline,
  onOpenSettings,
}: AvailabilityScreenProps) {
  const api = useLaguuniApi()
  const diagnostics = useDiagnostics()
  const availabilityReferenceDate = useAvailabilityReferenceDate()
  const readOnlyNoticeStore = useReadOnlyNoticeStore()
  const [isReadOnlyNoticeDismissed, setIsReadOnlyNoticeDismissed] = useState(
    () => readOnlyNoticeStore.isDismissed(),
  )
  const { selectedCable, selectCable } = useAvailabilityScope()
  const bookingBasket = useBookingBasket()
  const [pendingReplacement, setPendingReplacement] =
    useState<PendingBookingReplacement | null>(null)
  const activeCable = getCableById(selectedCable)
  const {
    availabilityState,
    loadMoreAvailability,
    refreshAvailabilitySelection,
  } = useAvailabilityOverview(api, selectedCable, availabilityReferenceDate, {
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
    keepBookingForMore,
    requestBooking,
  } = useBookingSheetController({
    onKeepBookingForMore: bookingBasket.addSelection,
    onBookingFinalized: async ({ result, selections }) => {
      setPendingReplacement(null)
      const submittedBasketRevision = bookingBasket.revision
      const uniqueSelections = [
        ...new Map(
          selections.map((selection) => [
            `${selection.cableId}:${selection.date}`,
            selection,
          ]),
        ).values(),
      ]

      await Promise.allSettled(
        uniqueSelections.map((selection) =>
          refreshAvailabilitySelection(selection.cableId, selection.date),
        ),
      )

      if (result.status === 'success') {
        bookingBasket.clearSelectionsIfUnchanged(submittedBasketRevision)
      }
    },
  })

  useEffect(() => {
    if (
      pendingReplacement === null ||
      (availabilityState.status !== 'ready' &&
        availabilityState.status !== 'refreshing')
    ) {
      return
    }

    const selection =
      pendingReplacement.current.cableId === selectedCable
        ? pendingReplacement.current
        : pendingReplacement.proposed.cableId === selectedCable
          ? pendingReplacement.proposed
          : undefined

    if (selection === undefined) {
      return
    }

    const selectionKey = getBookingSlotSelectionKey(selection)
    const selectionIsRendered = availabilityState.dayGroups.some((dayGroup) =>
      dayGroup.slots.some(
        (slot) =>
          getBookingSlotSelectionKey({
            cableId: selectedCable,
            date: dayGroup.date,
            endTime: slot.endTime,
            startTime: slot.startTime,
          }) === selectionKey,
      ),
    )

    if (!selectionIsRendered) {
      setPendingReplacement(null)
    }
  }, [availabilityState, pendingReplacement, selectedCable])

  const handleDismissReadOnlyNotice = useCallback(() => {
    readOnlyNoticeStore.dismiss()
    setIsReadOnlyNoticeDismissed(true)
  }, [readOnlyNoticeStore])
  const showReadOnlyNotice =
    isOnline && !isBookingReady && !isReadOnlyNoticeDismissed
  const bookingActionProps = getAvailabilityBookingActionProps(
    isBookingReady,
    isBookingInProgress,
    handleSlotIntent,
  )
  const handleClearSelections = () => {
    bookingBasket.clearSelections()
    setPendingReplacement(null)
  }
  const handleRemoveSelection = (
    selection: Parameters<typeof bookingBasket.removeSelection>[0],
  ) => {
    const selectionKey = getBookingSlotSelectionKey(selection)

    if (
      pendingReplacement !== null &&
      (getBookingSlotSelectionKey(pendingReplacement.current) ===
        selectionKey ||
        getBookingSlotSelectionKey(pendingReplacement.proposed) ===
          selectionKey)
    ) {
      setPendingReplacement(null)
    }

    bookingBasket.removeSelection(selection)
  }
  const reviewBasket = () => {
    requestBooking('basket', bookingBasket.selections)
  }
  const basket =
    bookingBasket.selections.length === 0
      ? { ...emptyBookingBasket, onAddSelection: handleSlotIntent }
      : {
          isSelected: bookingBasket.isSelected,
          kind: 'basket' as const,
          onAddSelection: handleSlotIntent,
          onRemoveSelection: handleRemoveSelection,
          onReview: reviewBasket,
          selections: bookingBasket.selections,
        }

  function handleSlotIntent(
    selection: Parameters<typeof bookingBasket.addSelection>[0],
  ) {
    if (bookingBasket.selections.length === 0) {
      requestBooking('initial', [selection])
      return
    }

    if (bookingBasket.isSelected(selection)) {
      handleRemoveSelection(selection)
      return
    }

    const current = getSelectionForDate(
      bookingBasket.selections,
      selection.date,
    )
    if (current === undefined || current.cableId === selection.cableId) {
      bookingBasket.addSelection(selection)
      return
    }

    setPendingReplacement({ current, proposed: selection })
  }

  return (
    <section aria-labelledby="availability-title" className="space-y-6">
      <ContentRail className="space-y-5">
        <BookingSheetFlow
          actions={{
            basket: { onClearSelection: handleClearSelections },
            initial: {
              continuation: 'add-more',
              onAddMore: keepBookingForMore,
            },
          }}
          bookingSheetState={bookingSheetState}
          confirmBooking={confirmBooking}
          dismissBookingSheet={dismissBookingSheet}
          onExportTrace={handleExportTrace}
        />
        <BookingReplacementSheet
          pendingReplacement={pendingReplacement}
          onKeepCurrentSelection={() => setPendingReplacement(null)}
          onReplace={() => {
            if (pendingReplacement !== null) {
              bookingBasket.addSelection(pendingReplacement.proposed)
            }
            setPendingReplacement(null)
          }}
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
          basket={basket}
          isOffline={!isOnline}
          onLoadMore={loadMoreAvailability}
          {...bookingActionProps}
        />
        <BookingBasketReviewButton
          selections={basket.selections}
          onReview={basket.onReview}
        />
      </div>
    </section>
  )
}
