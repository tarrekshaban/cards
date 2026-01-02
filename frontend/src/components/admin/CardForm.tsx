import { useState } from 'react'
import type { Card, CreateCardRequest, UpdateCardRequest } from '../../types/cards'

const ISSUERS = ['Chase', 'American Express', 'CapitalOne'] as const

interface CardFormProps {
  card?: Card
  onSubmit: (data: CreateCardRequest | UpdateCardRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function CardForm({ card, onSubmit, onCancel, isLoading = false }: CardFormProps) {
  const [name, setName] = useState(card?.name ?? '')
  const [issuer, setIssuer] = useState(card?.issuer ?? ISSUERS[0])
  const [imageUrl, setImageUrl] = useState(card?.image_url ?? '')
  const [error, setError] = useState('')

  const isEditing = !!card

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !issuer.trim()) {
      setError('Name and issuer are required')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        issuer: issuer.trim(),
        image_url: imageUrl.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save card')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1">
          Card Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Chase Sapphire Reserve"
          className="input"
        />
      </div>

      <div>
        <label className="block text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1">
          Issuer
        </label>
        <select
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
          className="input"
        >
          {ISSUERS.map((iss) => (
            <option key={iss} value={iss}>
              {iss}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1">
          Image URL (optional)
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="input"
        />
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
          {isLoading ? 'Saving...' : isEditing ? 'Update Card' : 'Create Card'}
        </button>
      </div>
    </form>
  )
}
