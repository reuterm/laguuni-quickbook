import type { BookingProfile, BookingSlotSelection } from '../../domain/booking'
import { getCableById } from '../../domain/cable'
import type { LocalDateString } from '../date'
import type { CheckoutPaymentMethod } from './booking-contracts'

export function createAddReservationRequestBody(
  selection: BookingSlotSelection,
) {
  const { productId } = getCableById(selection.cableId)

  return {
    count: 1,
    product_id: productId,
    reservation_count: 1,
    reservation_datestart: formatStorefrontDate(selection.date),
    reservation_timeend: formatStorefrontTime(selection.endTime),
    reservation_timestart: formatStorefrontTime(selection.startTime),
    resource_count: 1,
    version: 'fi_FI',
  }
}

export function createCheckoutRequestBody(
  profile: BookingProfile,
  paymentMethod: CheckoutPaymentMethod,
) {
  return {
    allowmarketing: 0,
    consolidated: 0,
    country: null,
    deliveryRules: [],
    email: profile.email,
    master: 1,
    more: null,
    name: profile.name,
    payment: paymentMethod,
    phone: profile.phone,
    terms_accepted: 1,
    version: 'fi_FI',
  }
}

export function createApplyCodeRequestBody(code: string) {
  return { code }
}

function formatStorefrontDate(date: LocalDateString): string {
  const [year, month, day] = date.split('-')

  if (!year || !month || !day) {
    throw new Error(`Booking date must be YYYY-MM-DD, received "${date}"`)
  }

  return `${Number(day)}.${Number(month)}.${year}`
}

function formatStorefrontTime(time: string): string {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new Error(`Booking time must be HH:MM, received "${time}"`)
  }

  return time.replace(':', '.')
}
