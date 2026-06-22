import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import type { BookingFlowResult, BookingSlotSelection } from '@/domain/booking'
import { DEFAULT_USER_SETTINGS, type UserSettings } from '@/domain/settings'
import type { AvailabilityWeek } from '@/features/availability/availability-calendar'
import type {
  AvailabilityDayGroup,
  AvailabilitySlot,
  AvailabilityWeekPage,
} from '@/features/availability/availability-service'
import type { AvailabilityState } from '@/features/availability/use-availability-overview'
import type { BookingSheetState } from '@/features/booking/use-booking-sheet-controller'
import { formatDisplayDate, parseLocalDate, toLocalDateString } from '@/lib/date'

export const STORYBOOK_REFERENCE_DATE = new Date('2026-05-14T12:00:00')

export const BOOKING_ENABLED_SETTINGS: UserSettings = {
  ...DEFAULT_USER_SETTINGS,
  email: 'test@example.com',
  name: 'Test User',
  phone: '+358401234567',
}

export const CALENDAR_VIEW_SETTINGS: UserSettings = {
  ...BOOKING_ENABLED_SETTINGS,
  availabilityView: 'calendar',
}

export const DEVELOPER_MODE_SETTINGS: UserSettings = {
  ...BOOKING_ENABLED_SETTINGS,
  availabilityView: 'calendar',
  defaultCable: 'easy',
  seasonPassCode: 'FIXTURE-DISCOUNT',
}

export function localDate(value: string) {
  return toLocalDateString(value)
}

export function createSelection(
  overrides: Partial<BookingSlotSelection> = {},
): BookingSlotSelection {
  return {
    cableId: 'pro',
    date: localDate('2026-05-14'),
    endTime: '16:00',
    startTime: '15:00',
    ...overrides,
  }
}

export function createAvailabilitySlot(
  overrides: Partial<AvailabilitySlot> = {},
): AvailabilitySlot {
  const selection = createSelection(overrides.selection)

  return {
    endTime: selection.endTime,
    freeCapacity: 3,
    id: `${selection.date}-${selection.startTime}`,
    selection,
    startTime: selection.startTime,
    totalCapacity: 4,
    ...overrides,
  }
}

export function createAvailabilityDayGroup(
  date: string,
  slotOverrides: Array<Partial<AvailabilitySlot>> = [],
): AvailabilityDayGroup {
  const normalizedDate = localDate(date)

  return {
    date: normalizedDate,
    displayDate: formatDisplayDate(normalizedDate),
    slots: slotOverrides.map((slot, index) =>
      createAvailabilitySlot({
        id: `${normalizedDate}-${slot.startTime ?? `slot-${index}`}`,
        selection: createSelection({
          cableId: slot.selection?.cableId ?? 'pro',
          date: normalizedDate,
          endTime: slot.selection?.endTime ?? slot.endTime ?? '16:00',
          startTime: slot.selection?.startTime ?? slot.startTime ?? '15:00',
        }),
        ...slot,
      }),
    ),
  }
}

export const BOOKABLE_DAY_GROUPS: readonly AvailabilityDayGroup[] = [
  createAvailabilityDayGroup('2026-05-14', [
    { freeCapacity: 3, startTime: '15:00', endTime: '16:00', totalCapacity: 4 },
    { freeCapacity: 1, startTime: '16:00', endTime: '17:00', totalCapacity: 4 },
  ]),
  createAvailabilityDayGroup('2026-05-15', [
    { freeCapacity: 4, startTime: '12:00', endTime: '13:00', totalCapacity: 4 },
    { freeCapacity: 2, startTime: '15:00', endTime: '16:00', totalCapacity: 4 },
  ]),
]

export const CALENDAR_DAY_GROUPS: readonly AvailabilityDayGroup[] = [
  createAvailabilityDayGroup('2026-05-11'),
  createAvailabilityDayGroup('2026-05-12'),
  createAvailabilityDayGroup('2026-05-13'),
  createAvailabilityDayGroup('2026-05-14', [
    { freeCapacity: 3, startTime: '15:00', endTime: '16:00', totalCapacity: 4 },
    { freeCapacity: 1, startTime: '16:00', endTime: '17:00', totalCapacity: 4 },
  ]),
  createAvailabilityDayGroup('2026-05-15', [
    { freeCapacity: 4, startTime: '12:00', endTime: '13:00', totalCapacity: 4 },
    { freeCapacity: 2, startTime: '15:00', endTime: '16:00', totalCapacity: 4 },
  ]),
  createAvailabilityDayGroup('2026-05-16'),
  createAvailabilityDayGroup('2026-05-17'),
]

export const EMPTY_DAY_GROUPS: readonly AvailabilityDayGroup[] = [
  createAvailabilityDayGroup('2026-05-11'),
  createAvailabilityDayGroup('2026-05-12'),
  createAvailabilityDayGroup('2026-05-13'),
  createAvailabilityDayGroup('2026-05-14'),
  createAvailabilityDayGroup('2026-05-15'),
  createAvailabilityDayGroup('2026-05-16'),
  createAvailabilityDayGroup('2026-05-17'),
]

export function createAvailabilityWeekPage(
  dayGroups: readonly AvailabilityDayGroup[],
  weekId: string = '2026-05-11',
): AvailabilityWeekPage {
  return {
    dayGroups,
    hasBookableSlots: dayGroups.some((dayGroup) => dayGroup.slots.length > 0),
    weekId,
    weekStartDate: parseLocalDate(localDate(weekId)),
  }
}

export function createAvailabilityWeek(
  dayGroups: readonly AvailabilityDayGroup[] = CALENDAR_DAY_GROUPS,
): AvailabilityWeek {
  return {
    days: dayGroups.map((dayGroup) => dayGroup) as Array<AvailabilityDayGroup | null>,
    id: '2026-05-11',
    label: '11 May - 17 May',
    weekStartDate: parseLocalDate(localDate('2026-05-11')),
  }
}

export function createReadyAvailabilityState(
  dayGroups: readonly AvailabilityDayGroup[] = BOOKABLE_DAY_GROUPS,
  overrides: Partial<Extract<AvailabilityState, { status: 'ready' }>> = {},
): AvailabilityState {
  return {
    appendErrorMessage: null,
    canLoadMore: true,
    dayGroups,
    isLoadingMore: false,
    status: 'ready',
    weekPages: [createAvailabilityWeekPage(dayGroups)],
    ...overrides,
  }
}

export function createRefreshingAvailabilityState(
  dayGroups: readonly AvailabilityDayGroup[] = BOOKABLE_DAY_GROUPS,
  overrides: Partial<Extract<AvailabilityState, { status: 'refreshing' }>> = {},
): AvailabilityState {
  return {
    appendErrorMessage: null,
    canLoadMore: true,
    dayGroups,
    isLoadingMore: false,
    status: 'refreshing',
    weekPages: [createAvailabilityWeekPage(dayGroups)],
    ...overrides,
  }
}

export function createBookingResult(
  status: 'success' | 'payment_required' | 'failed',
): BookingFlowResult {
  switch (status) {
    case 'success':
      return {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      }
    case 'payment_required':
      return {
        orderIdentifier: 'fixture-order-id',
        paymentToken: 'fixture-payment-token',
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      }
    case 'failed':
      return {
        errorCode: 'GENERAL_ERROR',
        message: 'Fixture checkout failed.',
        status: 'failed',
        step: 'checkout',
      }
  }
}

export function createBookingSheetState(
  status: BookingSheetState['status'],
): BookingSheetState {
  const selection = createSelection()

  switch (status) {
    case 'closed':
      return { status: 'closed' }
    case 'confirm':
      return { selection, status: 'confirm' }
    case 'submitting':
      return { selection, status: 'submitting' }
    case 'completed':
      return {
        result: createBookingResult('failed'),
        selection,
        status: 'completed',
        traceId: 'trace-failed',
      }
  }
}

export function MatchMediaState({
  children,
  matches,
}: {
  children: ReactNode
  matches: boolean
}) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const originalMatchMedia = window.matchMedia

    window.matchMedia = (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener() {},
      addListener() {},
      dispatchEvent() {
        return true
      },
      removeEventListener() {},
      removeListener() {},
    })

    setIsReady(true)

    return () => {
      window.matchMedia = originalMatchMedia
    }
  }, [matches])

  return isReady ? children : null
}

export function StorySurface({
  children,
  className = 'space-y-6',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`w-full ${className}`}>{children}</div>
}

export const noop = () => {}
export const noopAsync = async () => {}
