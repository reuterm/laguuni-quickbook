import type { CableId } from './cable'

export type UserSettings = {
  name: string
  phone: string
  email: string
  seasonPassCode: string
  defaultCable: CableId | null
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  name: '',
  phone: '',
  email: '',
  seasonPassCode: '',
  defaultCable: null,
}
