import type { CableId } from './cable'

export type UserSettings = {
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
  name: '',
  phone: '',
  email: '',
  seasonPassCode: '',
  defaultCable: null,
}
