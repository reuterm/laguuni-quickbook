import { describe, expect, it } from 'vitest'

import { createMemoryStorage } from './create-memory-storage'

describe('createMemoryStorage', () => {
  it('reads, writes, and removes values in memory', () => {
    const storage = createMemoryStorage({ existing: 'value' })

    expect(storage.getItem('existing')).toBe('value')
    expect(storage.getItem('missing')).toBeNull()

    storage.setItem('next', '123')
    expect(storage.getItem('next')).toBe('123')

    storage.removeItem('existing')
    expect(storage.getItem('existing')).toBeNull()
  })
})
