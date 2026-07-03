import type { CableId } from './cable'

export type UserSettings = {
  availabilityView: 'cards' | 'calendar'
  calendarExportEnabled: boolean
  name: string
  phone: string
  email: string
  seasonPassCode: string
  defaultCable: CableId | null
}

export type SettingsRecoveryIssue =
  | 'invalid-fields'
  | 'invalid-format'
  | 'unsupported-version'

export type UserSettingsLoadResult = {
  recoveryIssue: SettingsRecoveryIssue | null
  settings: UserSettings
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  availabilityView: 'cards',
  calendarExportEnabled: false,
  name: '',
  phone: '',
  email: '',
  seasonPassCode: '',
  defaultCable: null,
}
