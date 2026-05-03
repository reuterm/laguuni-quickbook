import { type CableId, SUPPORTED_CABLES } from '../../../domain/cable'

type AvailabilityCableSelectorProps = {
  onSelectCable: (cableId: CableId) => void
  selectedCable: CableId
}

export function AvailabilityCableSelector({
  onSelectCable,
  selectedCable,
}: AvailabilityCableSelectorProps) {
  return (
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
  )
}
