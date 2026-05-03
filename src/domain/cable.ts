export const SUPPORTED_CABLES = [
  { id: 'pro', label: 'Pro', productId: '6' },
  { id: 'easy', label: 'Easy', productId: '7' },
  { id: 'hietsu', label: 'Hietsu', productId: '157' },
] as const

export type Cable = (typeof SUPPORTED_CABLES)[number]
export type CableId = Cable['id']
