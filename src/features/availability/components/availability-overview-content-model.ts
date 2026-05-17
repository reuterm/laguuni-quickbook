import type { AvailabilityDayGroup } from '../availability-service'
import type { AvailabilityState } from '../use-availability-overview'

type AvailabilityOverviewViewMode = 'cards' | 'calendar'

type AvailabilityOverviewContentModel = {
  hasAppendError: boolean
  hasLoadedDayGroups: boolean
  hasRenderedAvailability: boolean
  isCalendarView: boolean
  isRefreshing: boolean
  renderedCardDayGroups: readonly AvailabilityDayGroup[]
  renderedDayGroups: readonly AvailabilityDayGroup[]
}

export function getAvailabilityOverviewContentModel(
  availabilityState: AvailabilityState,
  availabilityView: AvailabilityOverviewViewMode,
): AvailabilityOverviewContentModel {
  const hasLoadedDayGroups =
    availabilityState.status === 'ready' ||
    availabilityState.status === 'refreshing'
  const renderedDayGroups = hasLoadedDayGroups
    ? availabilityState.dayGroups
    : []

  return {
    hasAppendError:
      hasLoadedDayGroups && availabilityState.appendErrorMessage !== null,
    hasLoadedDayGroups,
    hasRenderedAvailability: renderedDayGroups.some(
      (dayGroup) => dayGroup.slots.length > 0,
    ),
    isCalendarView: availabilityView === 'calendar',
    isRefreshing: availabilityState.status === 'refreshing',
    renderedCardDayGroups: renderedDayGroups.filter(
      (dayGroup) => dayGroup.slots.length > 0,
    ),
    renderedDayGroups,
  }
}

export type { AvailabilityOverviewContentModel, AvailabilityOverviewViewMode }
