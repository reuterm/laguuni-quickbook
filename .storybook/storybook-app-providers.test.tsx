import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  useBrowserStorage,
  useReadOnlyNoticeStore,
} from '../src/app/providers'
import { useAvailabilityScope } from '../src/features/availability/use-availability-scope'
import { useDeveloperMode } from '../src/features/settings/use-developer-mode'
import { useUserSettings } from '../src/features/settings/use-user-settings'
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

  it('keeps the same storage instance for same-story rerenders when persisted-state identity is unchanged', () => {
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

    rerender(
      StorybookAppProviders(Story, {
        id: 'availability--same-story',
        parameters: {
          settings: {
            email: 'storybook@example.com',
            name: 'Storybook User',
          },
        },
      } as never),
    )

    expect(latestStorage).toBe(firstStorage)
    expect(screen.getByText('Mutated User')).toBeVisible()
    expect(screen.getByText('mutated@example.com')).toBeVisible()
  })

  it('renders stories directly without an implicit shared content frame', () => {
    const Story = () => <div data-testid="story-content">Story content</div>

    render(
      StorybookAppProviders(Story, {
        id: 'availability--centered-layout',
        parameters: {},
      } as never),
    )

    const storyContent = screen.getByTestId('story-content')
    const frame = storyContent.parentElement

    expect(frame).not.toBeNull()
    expect(frame?.className).not.toContain('min-h-svh')
    expect(frame?.className).not.toContain('max-w-7xl')
    expect(frame?.className).not.toContain('px-4')
    expect(frame?.className).not.toContain('py-6')
  })

  it('keeps the same storage instance when parameter object shape changes but canonical persisted-state identity is unchanged', () => {
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

    rerender(
      StorybookAppProviders(Story, {
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
      } as never),
    )

    expect(latestStorage).toBe(firstStorage)
    expect(screen.getByText('Mutated User')).toBeVisible()
    expect(screen.getByText('mutated@example.com')).toBeVisible()
  })

  it('keeps coherent storage-backed hook state on same-identity rerenders', () => {
    const Story = () => <PersistedStateProbe />
    const parameters = {
      developerMode: false,
      settings: {
        defaultCable: 'easy',
        email: 'storybook@example.com',
        name: 'Storybook User',
      },
    }

    const { rerender } = render(
      StorybookAppProviders(Story, {
        id: 'availability--same-identity-hooks',
        parameters,
      } as never),
    )

    expect(screen.getByText('name:Storybook User')).toBeVisible()
    expect(screen.getByText('email:storybook@example.com')).toBeVisible()
    expect(screen.getByText('developer-mode:false')).toBeVisible()
    expect(screen.getByText('selected-cable:easy')).toBeVisible()
    expect(screen.getByText('notice-dismissed:false')).toBeVisible()

    pressMutationButton()

    expect(screen.getByText('name:Mutated User')).toBeVisible()
    expect(screen.getByText('email:mutated@example.com')).toBeVisible()
    expect(screen.getByText('developer-mode:true')).toBeVisible()
    expect(screen.getByText('selected-cable:pro')).toBeVisible()
    expect(screen.getByText('notice-dismissed:true')).toBeVisible()

    rerender(
      StorybookAppProviders(Story, {
        id: 'availability--same-identity-hooks',
        parameters: {
          developerMode: false,
          settings: {
            email: 'storybook@example.com',
            name: 'Storybook User',
            defaultCable: 'easy',
          },
        },
      } as never),
    )

    expect(screen.getByText('name:Mutated User')).toBeVisible()
    expect(screen.getByText('email:mutated@example.com')).toBeVisible()
    expect(screen.getByText('developer-mode:true')).toBeVisible()
    expect(screen.getByText('selected-cable:pro')).toBeVisible()
    expect(screen.getByText('notice-dismissed:true')).toBeVisible()
  })

  it('reloads storage-backed hook state when seeded persisted-state changes for the same story', () => {
    const Story = () => <PersistedStateProbe />

    const firstRender = StorybookAppProviders(Story, {
      id: 'availability--seed-change',
      parameters: {
        developerMode: false,
        settings: {
          defaultCable: 'easy',
          email: 'first@example.com',
          name: 'First User',
        },
      },
    } as never)

    const { rerender } = render(firstRender)

    expect(screen.getByText('name:First User')).toBeVisible()
    expect(screen.getByText('email:first@example.com')).toBeVisible()
    expect(screen.getByText('developer-mode:false')).toBeVisible()
    expect(screen.getByText('selected-cable:easy')).toBeVisible()
    expect(screen.getByText('notice-dismissed:false')).toBeVisible()

    pressMutationButton()

    rerender(
      StorybookAppProviders(Story, {
        id: 'availability--seed-change',
        parameters: {
          developerMode: true,
          settings: {
            defaultCable: 'hietsu',
            email: 'second@example.com',
            name: 'Second User',
          },
        },
      } as never),
    )

    expect(screen.getByText('name:Second User')).toBeVisible()
    expect(screen.getByText('email:second@example.com')).toBeVisible()
    expect(screen.getByText('developer-mode:true')).toBeVisible()
    expect(screen.getByText('selected-cable:hietsu')).toBeVisible()
    expect(screen.getByText('notice-dismissed:false')).toBeVisible()
  })

  it('resets storage-backed hook state when switching stories with the same seed', () => {
    const Story = () => <PersistedStateProbe />
    const parameters = {
      developerMode: false,
      settings: {
        defaultCable: 'easy',
        email: 'storybook@example.com',
        name: 'Storybook User',
      },
    }

    const { rerender } = render(
      StorybookAppProviders(Story, {
        id: 'availability--first-seeded-story',
        parameters,
      } as never),
    )

    expect(screen.getByText('name:Storybook User')).toBeVisible()
    expect(screen.getByText('email:storybook@example.com')).toBeVisible()
    expect(screen.getByText('developer-mode:false')).toBeVisible()
    expect(screen.getByText('selected-cable:easy')).toBeVisible()
    expect(screen.getByText('notice-dismissed:false')).toBeVisible()

    pressMutationButton()

    expect(screen.getByText('name:Mutated User')).toBeVisible()
    expect(screen.getByText('email:mutated@example.com')).toBeVisible()
    expect(screen.getByText('developer-mode:true')).toBeVisible()
    expect(screen.getByText('selected-cable:pro')).toBeVisible()
    expect(screen.getByText('notice-dismissed:true')).toBeVisible()

    rerender(
      StorybookAppProviders(Story, {
        id: 'availability--second-seeded-story',
        parameters,
      } as never),
    )

    expect(screen.getByText('name:Storybook User')).toBeVisible()
    expect(screen.getByText('email:storybook@example.com')).toBeVisible()
    expect(screen.getByText('developer-mode:false')).toBeVisible()
    expect(screen.getByText('selected-cable:easy')).toBeVisible()
    expect(screen.getByText('notice-dismissed:false')).toBeVisible()
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

function PersistedStateProbe() {
  const readOnlyNoticeStore = useReadOnlyNoticeStore()
  const { settings, saveSettings } = useUserSettings()
  const { developerModeEnabled, registerVersionTap } = useDeveloperMode()
  const { selectedCable, selectCable } = useAvailabilityScope()

  function mutateState() {
    saveSettings({
      ...settings,
      email: 'mutated@example.com',
      name: 'Mutated User',
    })

    for (let tapCount = 0; tapCount < 7; tapCount += 1) {
      registerVersionTap()
    }

    selectCable('pro')
    readOnlyNoticeStore.dismiss()
  }

  return (
    <>
      <div>{`name:${settings.name}`}</div>
      <div>{`email:${settings.email}`}</div>
      <div>{`developer-mode:${developerModeEnabled}`}</div>
      <div>{`selected-cable:${selectedCable}`}</div>
      <div>{`notice-dismissed:${readOnlyNoticeStore.isDismissed()}`}</div>
      <button type="button" onClick={mutateState}>
        Mutate persisted state consumers
      </button>
    </>
  )
}

function pressMutationButton() {
  fireEvent.click(
    screen.getByRole('button', { name: 'Mutate persisted state consumers' }),
  )
}
