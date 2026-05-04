import type * as React from 'react'
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import {
  Sheet,
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
import { useUserSettings } from '../use-user-settings'

type SettingsScreenProps = {
  onOpenChange: (isOpen: boolean) => void
  open: boolean
}

type EditableField = Exclude<keyof UserSettings, 'defaultCable'>
const NO_DEFAULT_CABLE_VALUE = '__none__'

const settingsFieldDefinitions = [
  {
    autoComplete: 'name',
    id: 'name',
    key: 'name',
    label: 'Name',
    placeholder: 'Test User',
  },
  {
    autoComplete: 'tel',
    id: 'phone',
    key: 'phone',
    label: 'Phone',
    placeholder: '+358 40 123 4567',
    type: 'tel',
  },
  {
    autoComplete: 'email',
    id: 'email',
    key: 'email',
    label: 'Email',
    placeholder: 'test@example.com',
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
  id: string
  key: EditableField
  label: string
  placeholder: string
  type?: React.ComponentProps<typeof Input>['type']
}

export function SettingsScreen({ onOpenChange, open }: SettingsScreenProps) {
  const { recoveryIssue, saveSettings, settings } = useUserSettings()
  const [draftSettings, setDraftSettings] = useState<UserSettings>(settings)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    setDraftSettings(settings)
  }, [settings])

  useEffect(() => {
    if (!open) {
      setDraftSettings(settings)
      setIsSaved(false)
    }
  }, [open, settings])

  function handleFieldChange(field: EditableField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setDraftSettings((currentSettings) => ({
        ...currentSettings,
        [field]: event.target.value,
      }))
      setIsSaved(false)
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
    setIsSaved(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveSettings(draftSettings)
    setIsSaved(true)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="space-y-2 pr-10 text-left">
          <SheetTitle>Booking details</SheetTitle>
          <SheetDescription>
            Saved only in this browser for faster checkout.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {recoveryIssue !== null ? (
            <Alert role="alert">
              <AlertTitle>Saved settings were reset</AlertTitle>
              <AlertDescription>
                {getRecoveryMessage(recoveryIssue)}
              </AlertDescription>
            </Alert>
          ) : null}

          <p className="text-sm leading-6 text-muted-foreground">
            Your name, phone, email, season pass code, and default cable stay in
            this browser only.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              {settingsFieldDefinitions.map((field) => (
                <SettingsTextField
                  key={field.key}
                  definition={field}
                  value={draftSettings[field.key]}
                  onChange={handleFieldChange(field.key)}
                />
              ))}
            </div>

            <FormField
              htmlFor="default-cable"
              label="Default cable"
              description="Used only for the initial cable shown when the app opens."
            >
              <NativeSelect
                id="default-cable"
                name="defaultCable"
                value={draftSettings.defaultCable ?? NO_DEFAULT_CABLE_VALUE}
                onChange={(event) =>
                  handleDefaultCableChange(event.target.value)
                }
              >
                <option value={NO_DEFAULT_CABLE_VALUE}>No default cable</option>
                {SUPPORTED_CABLES.map((cable) => (
                  <option key={cable.id} value={cable.id}>
                    {cable.label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>

            <div className="space-y-3">
              <Button type="submit" className="w-full sm:w-auto">
                Save settings
              </Button>

              <p className="text-xs text-muted-foreground" role="status">
                {isSaved
                  ? 'Saved locally on this device.'
                  : 'Settings stay in this browser only.'}
              </p>
            </div>
          </form>
        </div>
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
        placeholder={definition.placeholder}
        type={definition.type}
        value={value}
        onChange={onChange}
      />
    </FormField>
  )
}
