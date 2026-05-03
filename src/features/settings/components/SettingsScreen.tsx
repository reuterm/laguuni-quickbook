import { SUPPORTED_CABLES } from '../../../domain/cable'

const DEFAULT_CABLE = SUPPORTED_CABLES[0].id

export function SettingsScreen() {
  return (
    <section className="screen-card" aria-labelledby="settings-title">
      <header className="screen-header">
        <p className="screen-kicker">Local settings</p>
        <h2 id="settings-title" className="screen-title">
          Booking details
        </h2>
        <p className="screen-copy">
          This placeholder screen reserves the structure for local profile
          persistence in phase 6.
        </p>
      </header>

      <form className="settings-form">
        <div className="field-grid">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Test User"
            />
          </div>

          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              autoComplete="tel"
              placeholder="+358 40 123 4567"
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
            />
          </div>

          <div className="field">
            <label htmlFor="season-pass-code">Season pass code</label>
            <input
              id="season-pass-code"
              name="seasonPassCode"
              placeholder="Stored locally in phase 6"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="default-cable">Default cable</label>
          <select
            id="default-cable"
            name="defaultCable"
            defaultValue={DEFAULT_CABLE}
          >
            {SUPPORTED_CABLES.map((cable) => (
              <option key={cable.id} value={cable.id}>
                {cable.label}
              </option>
            ))}
          </select>
        </div>

        <p className="field-help">
          The form is intentionally local-only. Browser storage wiring arrives
          in a later phase.
        </p>
      </form>
    </section>
  )
}
