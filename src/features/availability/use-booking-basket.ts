import { useRef, useState } from 'react'
import type { BookingSlotSelection } from '@/domain/booking'
import { getBookingSlotSelectionKey } from '../booking/booking-selections'

export function useBookingBasket() {
  const [selections, setSelections] = useState<readonly BookingSlotSelection[]>(
    [],
  )
  const revisionRef = useRef(0)

  function updateSelections(
    updater: (current: readonly BookingSlotSelection[]) => readonly BookingSlotSelection[],
  ) {
    revisionRef.current += 1
    setSelections(updater)
  }

  function addSelection(selection: BookingSlotSelection) {
    updateSelections((current) => [
      ...current.filter((item) => item.date !== selection.date),
      selection,
    ])
  }

  function removeSelection(selection: BookingSlotSelection) {
    const key = getBookingSlotSelectionKey(selection)
    updateSelections((current) =>
      current.filter((item) => getBookingSlotSelectionKey(item) !== key),
    )
  }

  function clearSelections() {
    updateSelections(() => [])
  }

  function clearSelectionsIfUnchanged(revision: number) {
    if (revision === revisionRef.current) {
      clearSelections()
    }
  }

  function isSelected(selection: BookingSlotSelection) {
    const key = getBookingSlotSelectionKey(selection)
    return selections.some((item) => getBookingSlotSelectionKey(item) === key)
  }

  return {
    selections,
    addSelection,
    removeSelection,
    clearSelections,
    clearSelectionsIfUnchanged,
    isSelected,
    revision: revisionRef.current,
  }
}
