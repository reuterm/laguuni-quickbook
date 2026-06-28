import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useBrowserStorage } from '../src/app/providers'
import {
  type BrowserStorage,
  SETTINGS_STORAGE_KEY,
} from '../src/lib/storage/local-storage'
import { StorybookAppProviders } from './storybook-app-providers'

describe('StorybookAppProviders', () => {
  afterEach(() => {
    cleanup()
    latestStorage = null
  })

  it('replaces storage for the same story when seeded values stay the same but settings gets a new object identity', () => {
    const Story = () => <StorageProbe />
    const firstParameters = {
      settings: {
        email: 'storybook@example.com',
        name: 'Storybook User',
      },
    }

    const firstRender = StorybookAppProviders(Story, {
      id: 'availability--same-story',
      parameters: firstParameters,
    } as never)

    const { rerender } = render(firstRender)
    const firstStorage = latestStorage

    expect(firstStorage).not.toBeNull()

    latestStorage?.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        availabilityView: 'cards',
        defaultCable: null,
        email: 'mutated@example.com',
        name: 'Mutated User',
        phone: '',
        seasonPassCode: '',
        version: 1,
      }),
    )

    const secondRender = StorybookAppProviders(Story, {
      id: 'availability--same-story',
      parameters: {
        settings: {
          email: 'storybook@example.com',
          name: 'Storybook User',
        },
      },
    } as never)

    rerender(secondRender)

    expect(latestStorage).not.toBe(firstStorage)
    expect(screen.getByText('Storybook User')).toBeVisible()
    expect(screen.getByText('storybook@example.com')).toBeVisible()
  })

  it('replaces storage for the same story when settings property order changes but values stay the same', () => {
    const Story = () => <StorageProbe />

    const firstRender = StorybookAppProviders(Story, {
      id: 'availability--same-story-order',
      parameters: {
        settings: {
          email: 'storybook@example.com',
          name: 'Storybook User',
        },
      },
    } as never)

    const { rerender } = render(firstRender)
    const firstStorage = latestStorage

    expect(firstStorage).not.toBeNull()

    latestStorage?.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        availabilityView: 'cards',
        defaultCable: null,
        email: 'mutated@example.com',
        name: 'Mutated User',
        phone: '',
        seasonPassCode: '',
        version: 1,
      }),
    )

    const secondRender = StorybookAppProviders(Story, {
      id: 'availability--same-story-order',
      parameters: {
        settings: {
          name: 'Storybook User',
          email: 'storybook@example.com',
        },
      },
    } as never)

    rerender(secondRender)

    expect(latestStorage).not.toBe(firstStorage)
    expect(screen.getByText('Storybook User')).toBeVisible()
    expect(screen.getByText('storybook@example.com')).toBeVisible()
  })

  it('replaces storage for the same story when partial settings and expanded equivalent settings seed the same stored values', () => {
    const Story = () => <StorageProbe />

    const firstRender = StorybookAppProviders(Story, {
      id: 'availability--same-story-defaults',
      parameters: {
        settings: {
          name: 'Storybook User',
        },
      },
    } as never)

    const { rerender } = render(firstRender)
    const firstStorage = latestStorage

    expect(firstStorage).not.toBeNull()

    latestStorage?.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        availabilityView: 'cards',
        defaultCable: null,
        email: 'mutated@example.com',
        name: 'Mutated User',
        phone: '',
        seasonPassCode: '',
        version: 1,
      }),
    )

    const secondRender = StorybookAppProviders(Story, {
      id: 'availability--same-story-defaults',
      parameters: {
        settings: {
          availabilityView: 'cards',
          defaultCable: null,
          email: '',
          name: 'Storybook User',
          phone: '',
          seasonPassCode: '',
        },
      },
    } as never)

    rerender(secondRender)

    expect(latestStorage).not.toBe(firstStorage)
    expect(screen.getByText('Storybook User')).toBeVisible()
    expect(screen.getByText('mutated@example.com')).toBeVisible()
  })

  it('replaces storage for the same story when corrupted settings mode ignores different settings payloads', () => {
    const Story = () => <StorageProbe />

    const firstRender = StorybookAppProviders(Story, {
      id: 'availability--corrupted-settings',
      parameters: {
        seedCorruptedSettings: true,
        settings: {
          name: 'Storybook User',
        },
      },
    } as never)

    const { rerender } = render(firstRender)
    const firstStorage = latestStorage

    expect(firstStorage).not.toBeNull()

    latestStorage?.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        availabilityView: 'cards',
        defaultCable: null,
        email: 'mutated@example.com',
        name: 'Mutated User',
        phone: '',
        seasonPassCode: '',
        version: 1,
      }),
    )

    const secondRender = StorybookAppProviders(Story, {
      id: 'availability--corrupted-settings',
      parameters: {
        seedCorruptedSettings: true,
        settings: {
          email: 'different@example.com',
          name: 'Different User',
        },
      },
    } as never)

    rerender(secondRender)

    expect(latestStorage).not.toBe(firstStorage)
    expect(screen.getByText('Mutated User')).toBeVisible()
    expect(screen.getByText('mutated@example.com')).toBeVisible()
  })

  it('replaces storage for the same story when only appVersion changes', () => {
    const Story = () => <StorageProbe />

    const firstRender = StorybookAppProviders(Story, {
      id: 'availability--app-version',
      parameters: {
        appVersion: 'storybook-a',
        settings: {
          name: 'Storybook User',
        },
      },
    } as never)

    const { rerender } = render(firstRender)
    const firstStorage = latestStorage

    expect(firstStorage).not.toBeNull()

    latestStorage?.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        availabilityView: 'cards',
        defaultCable: null,
        email: 'mutated@example.com',
        name: 'Mutated User',
        phone: '',
        seasonPassCode: '',
        version: 1,
      }),
    )

    const secondRender = StorybookAppProviders(Story, {
      id: 'availability--app-version',
      parameters: {
        appVersion: 'storybook-b',
        settings: {
          name: 'Storybook User',
        },
      },
    } as never)

    rerender(secondRender)

    expect(latestStorage).not.toBe(firstStorage)
    expect(screen.getByText('Storybook User')).toBeVisible()
    expect(screen.getByText('mutated@example.com')).toBeVisible()
  })

  it('replaces storage for the same story when only availabilityReferenceDate changes', () => {
    const Story = () => <StorageProbe />

    const firstRender = StorybookAppProviders(Story, {
      id: 'availability--reference-date',
      parameters: {
        availabilityReferenceDate: new Date('2026-05-14T12:00:00Z'),
        settings: {
          name: 'Storybook User',
        },
      },
    } as never)

    const { rerender } = render(firstRender)
    const firstStorage = latestStorage

    expect(firstStorage).not.toBeNull()

    latestStorage?.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        availabilityView: 'cards',
        defaultCable: null,
        email: 'mutated@example.com',
        name: 'Mutated User',
        phone: '',
        seasonPassCode: '',
        version: 1,
      }),
    )

    const secondRender = StorybookAppProviders(Story, {
      id: 'availability--reference-date',
      parameters: {
        availabilityReferenceDate: new Date('2026-06-14T12:00:00Z'),
        settings: {
          name: 'Storybook User',
        },
      },
    } as never)

    rerender(secondRender)

    expect(latestStorage).not.toBe(firstStorage)
    expect(screen.getByText('Storybook User')).toBeVisible()
    expect(screen.getByText('mutated@example.com')).toBeVisible()
  })

  it('creates a fresh storage instance for each story identity even with identical seeded parameters', () => {
    const Story = () => <StorageProbe />
    const parameters = {
      settings: {
        email: 'storybook@example.com',
        name: 'Storybook User',
      },
    }

    const firstRender = StorybookAppProviders(Story, {
      id: 'availability--first-story',
      parameters,
    } as never)

    const { rerender } = render(firstRender)

    expect(screen.getByText('Storybook User')).toBeVisible()
    expect(screen.getByText('storybook@example.com')).toBeVisible()

    latestStorage?.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        availabilityView: 'cards',
        defaultCable: null,
        email: 'mutated@example.com',
        name: 'Mutated User',
        phone: '',
        seasonPassCode: '',
        version: 1,
      }),
    )

    const secondRender = StorybookAppProviders(Story, {
      id: 'availability--second-story',
      parameters,
    } as never)

    rerender(secondRender)

    expect(screen.getByText('Storybook User')).toBeVisible()
    expect(screen.getByText('storybook@example.com')).toBeVisible()
    expect(screen.queryByText('Mutated User')).not.toBeInTheDocument()
  })
})

let latestStorage: BrowserStorage | null = null

function StorageProbe() {
  latestStorage = useBrowserStorage()
  const settings = latestStorage.getItem(SETTINGS_STORAGE_KEY)

  return (
    <>
      <div>
        {settings?.includes('Storybook User')
          ? 'Storybook User'
          : 'Mutated User'}
      </div>
      <div>
        {settings?.includes('storybook@example.com')
          ? 'storybook@example.com'
          : 'mutated@example.com'}
      </div>
    </>
  )
}
