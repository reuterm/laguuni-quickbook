import type { BookingFlowFailure, BookingProfile } from '../../domain/booking'

type BookingProfileField = 'email' | 'name' | 'phone'

export type BookingProfileValidationResult =
  | {
      profile: BookingProfile
      status: 'valid'
    }
  | {
      failure: BookingFlowFailure
      missingFields: readonly BookingProfileField[]
      status: 'invalid'
    }

export function validateBookingProfile(
  profile: BookingProfile,
): BookingProfileValidationResult {
  const normalizedProfile = normalizeBookingProfile(profile)
  const missingFields = listMissingProfileFields(normalizedProfile)

  if (missingFields.length > 0) {
    return {
      failure: {
        errorCode: 'missing-profile',
        message: `Missing required profile fields: ${missingFields.join(', ')}`,
        status: 'failed',
        step: 'profile',
      },
      missingFields,
      status: 'invalid',
    }
  }

  return {
    profile: normalizedProfile,
    status: 'valid',
  }
}

function normalizeBookingProfile(profile: BookingProfile): BookingProfile {
  return {
    ...profile,
    email: profile.email.trim(),
    name: profile.name.trim(),
    phone: profile.phone.trim(),
  }
}

function listMissingProfileFields(
  profile: BookingProfile,
): readonly BookingProfileField[] {
  const missingFields: BookingProfileField[] = []

  if (profile.name.length === 0) {
    missingFields.push('name')
  }

  if (profile.phone.length === 0) {
    missingFields.push('phone')
  }

  if (profile.email.length === 0) {
    missingFields.push('email')
  }

  return missingFields
}
