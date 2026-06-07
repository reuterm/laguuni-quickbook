export const SUPPORTED_CABLES = [
  { id: 'pro', label: 'Pro', productId: '6' },
  { id: 'easy', label: 'Easy', productId: '7' },
  { id: 'hietsu', label: 'Hietsu', productId: '157' },
] as const

export type Cable = (typeof SUPPORTED_CABLES)[number]
export type CableId = Cable['id']

export const DEFAULT_CABLE_ID: CableId = SUPPORTED_CABLES[0].id

const CABLE_BY_ID = {
  pro: SUPPORTED_CABLES[0],
  easy: SUPPORTED_CABLES[1],
  hietsu: SUPPORTED_CABLES[2],
} satisfies Record<CableId, Cable>

export function getCableById(cableId: CableId): Cable {
  return CABLE_BY_ID[cableId]
}

export function isCableId(value: string): value is CableId {
  return value in CABLE_BY_ID
}
