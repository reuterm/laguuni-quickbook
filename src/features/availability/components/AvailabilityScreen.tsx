import {
  type CableId,
  getCableById,
  SUPPORTED_CABLES,
} from '../../../domain/cable'

type AvailabilityScreenProps = {
  selectedCable: CableId
  onSelectCable: (cableId: CableId) => void
}

const PLACEHOLDER_DAYS = [
  {
    title: 'Next bookable day',
    copy: 'Date loading and slot grouping arrive in phase 5 with mocked storefront data.',
  },
  {
    title: 'Capacity overview',
    copy: 'Capacity labels and deterministic Book actions land once the mocked API flow is wired.',
  },
] as const

const PLACEHOLDER_SLOTS = [
  { time: '15:00', availability: 'Capacity fixture pending', action: 'Book' },
  { time: '16:00', availability: 'Booking seam pending', action: 'Book' },
] as const

export function AvailabilityScreen({
  selectedCable,
  onSelectCable,
}: AvailabilityScreenProps) {
  const activeCable = getCableById(selectedCable)

  return (
    <section className="screen-card" aria-labelledby="availability-title">
      <header className="screen-header">
        <p className="screen-kicker">Availability overview</p>
        <h2 id="availability-title" className="screen-title">
          Book a one-hour cable slot
        </h2>
        <p className="screen-copy">
          The shell already supports all three cables. Live dates, slot
          capacity, and mocked booking actions come in the next skeleton phases.
        </p>
      </header>

      <fieldset className="cable-switch">
        <legend className="screen-kicker">Supported cables</legend>
        {SUPPORTED_CABLES.map((cable) => (
          <button
            key={cable.id}
            type="button"
            className={`cable-button${
              selectedCable === cable.id ? ' cable-button--active' : ''
            }`}
            onClick={() => onSelectCable(cable.id)}
            aria-pressed={selectedCable === cable.id}
          >
            {cable.label}
          </button>
        ))}
      </fieldset>

      <div className="placeholder-grid">
        {PLACEHOLDER_DAYS.map((day) => (
          <article key={day.title} className="placeholder-card">
            <h3 className="placeholder-card__title">{day.title}</h3>
            <p className="placeholder-card__copy">{day.copy}</p>
          </article>
        ))}
      </div>

      <div className="slot-list">
        {PLACEHOLDER_SLOTS.map((slot) => (
          <article key={slot.time} className="slot-row">
            <div className="slot-row__meta">
              <span className="slot-row__time">{slot.time}</span>
              <span className="slot-row__availability">
                {slot.availability}
              </span>
            </div>
            <button type="button" className="slot-book" disabled>
              {slot.action}
            </button>
          </article>
        ))}
      </div>

      <p className="screen-note">
        Current cable: <strong>{activeCable.label}</strong> (product{' '}
        <strong>{activeCable.productId}</strong>)
      </p>
    </section>
  )
}
