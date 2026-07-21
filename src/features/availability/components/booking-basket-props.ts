import type { BookingSlotSelection } from '../../../domain/booking'

export type BookingBasketProps = {
  kind: 'basket' | 'initial'
  selections: readonly BookingSlotSelection[]
  isSelected: (selection: BookingSlotSelection) => boolean
  onAddSelection: (selection: BookingSlotSelection) => void
  onRemoveSelection: (selection: BookingSlotSelection) => void
  onReview: () => void
}

export const emptyBookingBasket: BookingBasketProps = {
  kind: 'initial',
  selections: [],
  isSelected: () => false,
  onAddSelection: () => {},
  onRemoveSelection: () => {},
  onReview: () => {},
}
