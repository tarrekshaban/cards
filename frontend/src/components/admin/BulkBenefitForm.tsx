import { useState } from 'react'
import type { CreateBenefitRequest, BenefitSchedule } from '../../types/cards'

interface BulkBenefitFormProps {
  onSubmit: (benefits: CreateBenefitRequest[]) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const EXAMPLE_JSON = `[
  {
    "name": "Travel Credit",
    "description": "Annual travel reimbursement",
    "value": 300,
    "schedule": "calendar_year"
  },
  {
    "name": "Lounge Access",
    "value": 50,
    "schedule": "monthly"
  }
]`

const VALID_SCHEDULES: BenefitSchedule[] = [
  'calendar_year',
  'card_year',
  'monthly',
  'quarterly',
  'biannual',
  'one_time',
]

interface ParsedBenefit {
  name: string
  description?: string
  value: number
  schedule: BenefitSchedule
}

function validateBenefits(data: unknown): { valid: boolean; benefits: CreateBenefitRequest[]; error?: string } {
  if (!Array.isArray(data)) {
    return { valid: false, benefits: [], error: 'JSON must be an array of benefits' }
  }

  if (data.length === 0) {
    return { valid: false, benefits: [], error: 'Array must contain at least one benefit' }
  }

  const benefits: CreateBenefitRequest[] = []

  for (let i = 0; i < data.length; i++) {
    const item = data[i] as ParsedBenefit
    
    if (typeof item.name !== 'string' || !item.name.trim()) {
      return { valid: false, benefits: [], error: `Benefit #${i + 1}: "name" is required and must be a string` }
    }
    
    if (typeof item.value !== 'number' || item.value < 0) {
      return { valid: false, benefits: [], error: `Benefit #${i + 1}: "value" is required and must be a positive number` }
    }
    
    if (!VALID_SCHEDULES.includes(item.schedule)) {
      return { valid: false, benefits: [], error: `Benefit #${i + 1}: "schedule" must be one of: ${VALID_SCHEDULES.join(', ')}` }
    }

    benefits.push({
      name: item.name.trim(),
      description: item.description?.trim() || undefined,
      value: item.value,
      schedule: item.schedule,
    })
  }

  return { valid: true, benefits }
}

export default function BulkBenefitForm({ onSubmit, onCancel, isLoading = false }: BulkBenefitFormProps) {
  const [jsonInput, setJsonInput] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<CreateBenefitRequest[] | null>(null)

  const handleInputChange = (value: string) => {
    setJsonInput(value)
    setError('')
    setPreview(null)

    if (!value.trim()) return

    try {
      const parsed = JSON.parse(value)
      const result = validateBenefits(parsed)
      
      if (result.valid) {
        setPreview(result.benefits)
      } else {
        setError(result.error || 'Invalid format')
      }
    } catch {
      setError('Invalid JSON syntax')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!preview || preview.length === 0) {
      setError('No valid benefits to add')
      return
    }

    try {
      await onSubmit(preview)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add benefits')
    }
  }

  const loadExample = () => {
    handleInputChange(EXAMPLE_JSON)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[9px] uppercase tracking-[0.2em] text-text-muted">
            JSON Benefits Array
          </label>
          <button
            type="button"
            onClick={loadExample}
            className="text-[9px] text-text-muted hover:text-text uppercase tracking-wider"
          >
            Load Example
          </button>
        </div>
        <textarea
          value={jsonInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={EXAMPLE_JSON}
          className="input font-mono text-xs h-48 resize-y"
          spellCheck={false}
        />
        <p className="text-[9px] text-text-faint mt-1">
          Valid schedules: {VALID_SCHEDULES.join(', ')}
        </p>
      </div>

      {error && (
        <div className="border border-red-900/50 bg-red-950/20 text-red-400 px-3 py-2 text-xs">
          {error}
        </div>
      )}

      {preview && preview.length > 0 && (
        <div className="border border-green-900/50 bg-green-950/20 px-3 py-2">
          <p className="text-[9px] uppercase text-green-400 mb-2">
            Preview: {preview.length} benefit{preview.length !== 1 ? 's' : ''} to add
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {preview.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-text">${b.value}</span>
                <span className="text-text-muted">{b.name}</span>
                <span className="text-[9px] px-1 py-0.5 border border-border text-text-faint">
                  {b.schedule}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={isLoading || !preview || preview.length === 0}
        >
          {isLoading ? 'Adding...' : `Add ${preview?.length || 0} Benefits`}
        </button>
      </div>
    </form>
  )
}
