import { useState } from 'react'
import type { Benefit, BenefitSchedule, CreateBenefitRequest, UpdateBenefitRequest } from '../../types/cards'

interface BenefitFormProps {
  benefit?: Benefit
  onSubmit: (data: CreateBenefitRequest | UpdateBenefitRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const scheduleOptions: { value: BenefitSchedule; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannual', label: 'Biannual (every 6 months)' },
  { value: 'calendar_year', label: 'Calendar Year (resets Jan 1)' },
  { value: 'card_year', label: 'Card Year (resets on anniversary)' },
  { value: 'one_time', label: 'One-time (e.g., signup bonus)' },
]

export default function BenefitForm({ benefit, onSubmit, onCancel, isLoading = false }: BenefitFormProps) {
  const [name, setName] = useState(benefit?.name ?? '')
  const [description, setDescription] = useState(benefit?.description ?? '')
  const [value, setValue] = useState(benefit?.value?.toString() ?? '')
  const [schedule, setSchedule] = useState<BenefitSchedule>(benefit?.schedule ?? 'monthly')
  const [error, setError] = useState('')

  const isEditing = !!benefit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0) {
      setError('Value must be a valid positive number')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        value: numValue,
        schedule,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save benefit')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1">
          Benefit Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Travel Credit"
          className="input"
        />
      </div>

      <div>
        <label className="block text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Annual travel credit for flights, hotels, etc."
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1">
            Value ($)
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="300"
            min="0"
            step="0.01"
            className="input"
          />
        </div>

        <div>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1">
            Schedule
          </label>
          <select
            value={schedule}
            onChange={(e) => setSchedule(e.target.value as BenefitSchedule)}
            className="input"
          >
            {scheduleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEditing ? 'Update Benefit' : 'Add Benefit'}
        </button>
      </div>
    </form>
  )
}
