import '../settings.css'

import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'

import { isCableId, SUPPORTED_CABLES } from '../../../domain/cable'
import type {
  SettingsRecoveryIssue,
  UserSettings,
} from '../../../domain/settings'
import { useUserSettings } from '../use-user-settings'

type SettingsScreenProps = {
  isActive: boolean
}

type EditableField = Exclude<keyof UserSettings, 'defaultCable'>

export function SettingsScreen({ isActive }: SettingsScreenProps) {
  const { recoveryIssue, saveSettings, settings } = useUserSettings()
  const [draftSettings, setDraftSettings] = useState<UserSettings>(settings)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    setDraftSettings(settings)
  }, [settings])

  function handleFieldChange(field: EditableField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setDraftSettings((currentSettings) => ({
        ...currentSettings,
        [field]: event.target.value,
      }))
      setIsSaved(false)
    }
  }

  function handleDefaultCableChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextCableId = event.target.value

    setDraftSettings((currentSettings) => ({
      ...currentSettings,
      defaultCable:
        nextCableId === '' ? null : isCableId(nextCableId) ? nextCableId : null,
    }))
    setIsSaved(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveSettings(draftSettings)
    setIsSaved(true)
  }

  return (
    <section
      className="screen-card"
      aria-labelledby="settings-title"
      hidden={!isActive}
    >
      <header className="screen-header">
        <p className="screen-kicker">Local settings</p>
        <h2 id="settings-title" className="screen-title">
          Booking details
        </h2>
        <p className="screen-copy">
          Save your booking details locally on this device so later booking
          steps can reuse them without a backend account.
        </p>
      </header>

      {recoveryIssue !== null ? (
        <p className="status-note" role="alert">
          {getRecoveryMessage(recoveryIssue)}
        </p>
      ) : null}

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Test User"
              value={draftSettings.name}
              onChange={handleFieldChange('name')}
            />
          </div>

          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              autoComplete="tel"
              placeholder="+358 40 123 4567"
              value={draftSettings.phone}
              onChange={handleFieldChange('phone')}
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              autoComplete="email"
              placeholder="test@example.com"
              type="email"
              value={draftSettings.email}
              onChange={handleFieldChange('email')}
            />
          </div>

          <div className="field">
            <label htmlFor="season-pass-code">Season pass code</label>
            <input
              id="season-pass-code"
              name="seasonPassCode"
              placeholder="Optional"
              value={draftSettings.seasonPassCode}
              onChange={handleFieldChange('seasonPassCode')}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="default-cable">Default cable</label>
          <select
            id="default-cable"
            name="defaultCable"
            value={draftSettings.defaultCable ?? ''}
            onChange={handleDefaultCableChange}
          >
            <option value="">No default cable</option>
            {SUPPORTED_CABLES.map((cable) => (
              <option key={cable.id} value={cable.id}>
                {cable.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="primary-action">
            Save settings
          </button>

          <p className="status-note" role="status">
            {isSaved
              ? 'Saved locally on this device.'
              : 'Settings stay in this browser only.'}
          </p>
        </div>
      </form>
    </section>
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
