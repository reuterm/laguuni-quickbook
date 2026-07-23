import type * as React from 'react'
import { type ChangeEvent, useRef, useState } from 'react'

import { useAppVersion, useDiagnostics } from '@/app/providers'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTitle } from '@/components/ui/alert-title'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { NativeSelect } from '@/components/ui/select'
import {
  Sheet,
  SheetCloseButton,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { isCableId, SUPPORTED_CABLES } from '../../../domain/cable'
import type {
  SettingsRecoveryIssue,
  UserSettings,
} from '../../../domain/settings'
import { DiagnosticsCopyAction } from '../../diagnostics/DiagnosticsCopyAction'
import { exportDiagnostics } from '../../diagnostics/export'
import { useDeveloperMode } from '../use-developer-mode'
import { useUserSettings } from '../use-user-settings'

type SettingsScreenProps = {
  onOpenChange: (isOpen: boolean) => void
  open: boolean
}

type EditableField = Exclude<
  keyof UserSettings,
  'availabilityView' | 'defaultCable'
>
const NO_DEFAULT_CABLE_VALUE = '__none__'

const settingsFieldDefinitions = [
  {
    autoComplete: 'name',
    autoCapitalize: 'words',
    id: 'name',
    key: 'name',
    label: 'Name',
    placeholder: 'Test User',
  },
  {
    autoComplete: 'tel',
    autoCapitalize: 'off',
    id: 'phone',
    inputMode: 'tel',
    key: 'phone',
    label: 'Phone',
    placeholder: '+358 40 123 4567',
    spellCheck: false,
    type: 'tel',
  },
  {
    autoComplete: 'email',
    autoCapitalize: 'off',
    id: 'email',
    inputMode: 'email',
    key: 'email',
    label: 'Email',
    placeholder: 'test@example.com',
    spellCheck: false,
    type: 'email',
  },
  {
    id: 'season-pass-code',
    key: 'seasonPassCode',
    label: 'Season pass code',
    placeholder: 'Optional',
  },
] satisfies readonly SettingsFieldDefinition[]

type SettingsFieldDefinition = {
  autoComplete?: string
  autoCapitalize?: React.ComponentProps<typeof Input>['autoCapitalize']
  id: string
  inputMode?: React.ComponentProps<typeof Input>['inputMode']
  key: EditableField
  label: string
  placeholder: string
  spellCheck?: boolean
  type?: React.ComponentProps<typeof Input>['type']
}

export function SettingsScreen({ onOpenChange, open }: SettingsScreenProps) {
  const appVersion = useAppVersion()
  const diagnostics = useDiagnostics()
  const { recoveryIssue, saveSettings, settings } = useUserSettings()
  const {
    developerModeEnabled,
    disableDeveloperMode,
    registerVersionTap,
    resetDeveloperModeUnlockProgress,
  } = useDeveloperMode()
  const [draftSettings, setDraftSettings] = useState<UserSettings>(settings)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const displayedDraftSettings = open ? draftSettings : settings

  function handleFieldChange(field: EditableField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setDraftSettings((currentSettings) => ({
        ...currentSettings,
        [field]: event.target.value,
      }))
    }
  }

  function handleDefaultCableChange(nextCableId: string) {
    setDraftSettings((currentSettings) => ({
      ...currentSettings,
      defaultCable:
        nextCableId === NO_DEFAULT_CABLE_VALUE
          ? null
          : isCableId(nextCableId)
            ? nextCableId
            : null,
    }))
  }

  function handleAvailabilityViewChange(
    nextView: UserSettings['availabilityView'],
  ) {
    setDraftSettings((currentSettings) => ({
      ...currentSettings,
      availabilityView: nextView,
    }))
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    saveSettings(draftSettings)
    handleOpenChange(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setDraftSettings(settings)
      resetDeveloperModeUnlockProgress()
    }

    onOpenChange(nextOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-lg"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          closeButtonRef.current?.focus()
        }}
        showCloseButton={false}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 sm:space-y-6">
            <SheetHeader className="space-y-2 pr-10 text-left">
              <SheetTitle>Booking details</SheetTitle>
              <SheetDescription>
                Your name, phone, email, season pass code, and default cable are
                saved only in this browser for faster checkout.
              </SheetDescription>
            </SheetHeader>

            {recoveryIssue !== null ? (
              <Alert role="alert">
                <AlertTitle>Saved settings were reset</AlertTitle>
                <AlertDescription>
                  {getRecoveryMessage(recoveryIssue)}
                </AlertDescription>
              </Alert>
            ) : null}

            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                {settingsFieldDefinitions.map((field) => (
                  <SettingsTextField
                    key={field.key}
                    definition={field}
                    value={displayedDraftSettings[field.key]}
                    onChange={handleFieldChange(field.key)}
                  />
                ))}
              </div>

              <FormField htmlFor="default-cable" label="Default cable">
                <NativeSelect
                  id="default-cable"
                  name="defaultCable"
                  value={
                    displayedDraftSettings.defaultCable ??
                    NO_DEFAULT_CABLE_VALUE
                  }
                  onChange={(event) =>
                    handleDefaultCableChange(event.target.value)
                  }
                >
                  <option value={NO_DEFAULT_CABLE_VALUE}>
                    No default cable
                  </option>
                  {SUPPORTED_CABLES.map((cable) => (
                    <option key={cable.id} value={cable.id}>
                      {cable.label}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Availability view
                </p>
                <SegmentedControl
                  ariaLabel="Availability view"
                  className="w-full"
                  itemClassName="min-h-11"
                  items={[
                    { label: 'Auto', value: 'cards' },
                    { label: 'Calendar only', value: 'calendar' },
                  ]}
                  onValueChange={handleAvailabilityViewChange}
                  value={displayedDraftSettings.availabilityView}
                />
                <p className="text-sm text-muted-foreground">
                  Auto adapts to the screen size. Calendar only keeps the
                  calendar layout on every screen size.
                </p>
              </div>

              <div className="space-y-3">
                <Button type="submit" className="w-full sm:w-auto">
                  Save settings
                </Button>
              </div>
            </form>
          </div>

          {developerModeEnabled ? (
            <div className="mt-6 border-t pt-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Developer tools</h3>
                  <p className="text-sm text-muted-foreground">
                    Diagnostics and debugging actions for this device.
                  </p>
                </div>
                <DiagnosticsCopyAction
                  buttonContent="Export all diagnostics logs"
                  buttonClassName="w-full justify-start sm:w-auto"
                  buttonVariant="outline"
                  onCopy={() =>
                    exportDiagnostics((options) =>
                      diagnostics.exportLogs(options),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    diagnostics.clear()
                  }}
                >
                  Clear diagnostics log
                </Button>
              </div>

              <div className="pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={disableDeveloperMode}
                >
                  Disable developer mode
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 border-t pt-3 sm:mt-6 sm:pt-6">
            <button
              type="button"
              className="cursor-default text-xs text-muted-foreground"
              aria-label={`App version ${appVersion}`}
              onClick={registerVersionTap}
            >
              Version {appVersion}
            </button>
          </div>
        </div>
        <SheetCloseButton ref={closeButtonRef} />
      </SheetContent>
    </Sheet>
  )
}

function getRecoveryMessage(recoveryIssue: SettingsRecoveryIssue): string {
  switch (recoveryIssue) {
    case 'invalid-fields':
      return 'Some previously saved settings were invalid and were reset to safe defaults on this device.'
    case 'unsupported-version':
      return 'Previously saved settings used an unsupported format and were reset to safe defaults on this device.'
    case 'invalid-format':
      return 'Previously saved settings could not be read and were reset to safe defaults on this device.'
  }
}

type SettingsTextFieldProps = {
  definition: SettingsFieldDefinition
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  value: string
}

function SettingsTextField({
  definition,
  onChange,
  value,
}: SettingsTextFieldProps) {
  return (
    <FormField htmlFor={definition.id} label={definition.label}>
      <Input
        id={definition.id}
        name={definition.key}
        autoComplete={definition.autoComplete}
        autoCapitalize={definition.autoCapitalize}
        inputMode={definition.inputMode}
        placeholder={definition.placeholder}
        spellCheck={definition.spellCheck}
        type={definition.type}
        value={value}
        onChange={onChange}
      />
    </FormField>
  )
}
