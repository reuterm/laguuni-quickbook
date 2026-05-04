import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-border/80 sm:max-w-lg"
      >
        <SheetHeader className="space-y-2 pr-8 text-left">
          <SheetTitle>Booking details</SheetTitle>
          <SheetDescription>
            Saved only in this browser for faster checkout.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {recoveryIssue !== null ? (
            <Alert role="alert" className="rounded-xl">
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Test User"
                  value={draftSettings.name}
                  onChange={handleFieldChange('name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  autoComplete="tel"
                  placeholder="+358 40 123 4567"
                  type="tel"
                  value={draftSettings.phone}
                  onChange={handleFieldChange('phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  autoComplete="email"
                  placeholder="test@example.com"
                  type="email"
                  value={draftSettings.email}
                  onChange={handleFieldChange('email')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="season-pass-code">Season pass code</Label>
                <Input
                  id="season-pass-code"
                  name="seasonPassCode"
                  placeholder="Optional"
                  value={draftSettings.seasonPassCode}
                  onChange={handleFieldChange('seasonPassCode')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-cable">Default cable</Label>
              <select
                id="default-cable"
                name="defaultCable"
                className="flex h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow,border-color,background-color] focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
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
              </select>
              <p className="text-sm text-muted-foreground">
                Used only for the initial cable shown when the app opens.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button type="submit" size="sm" className="w-full sm:w-auto">
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
