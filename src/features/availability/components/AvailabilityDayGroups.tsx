import type { BookingSlotSelection } from '../../../domain/booking'
import type { AvailabilityDayGroup } from '../availability-service'

type AvailabilityDayGroupsProps = {
  dayGroups: readonly AvailabilityDayGroup[]
  onBookSelection?: ((selection: BookingSlotSelection) => void) | undefined
}

export function AvailabilityDayGroups({
  dayGroups,
  onBookSelection,
}: AvailabilityDayGroupsProps) {
  return (
    <div className="day-groups">
      {dayGroups.map((dayGroup) => (
        <section key={dayGroup.date} className="day-group">
          <h3 className="day-group__title">{dayGroup.displayDate}</h3>

          <div className="slot-list">
            {dayGroup.slots.map((slot) => (
              <article key={slot.id} className="slot-row">
                <div className="slot-row__meta">
                  <span className="slot-row__time">
                    {slot.startTime}-{slot.endTime}
                  </span>
                  <span className="slot-row__availability">
                    {slot.availabilityLabel}
                  </span>
                </div>
                <button
                  type="button"
                  className="slot-book"
                  disabled={onBookSelection === undefined}
                  onClick={() => onBookSelection?.(slot.selection)}
                >
                  Book
                </button>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
