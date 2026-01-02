import { useState } from 'react'
import type { CardWithBenefits } from '../../types/cards'

interface AddCardModalProps {
  card: CardWithBenefits
  onClose: () => void
  onAdd: (cardId: string, cardOpenDate: string, nickname?: string) => Promise<void>
  isLoading?: boolean
}

export default function AddCardModal({ card, onClose, onAdd, isLoading = false }: AddCardModalProps) {
  const [cardOpenDate, setCardOpenDate] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!cardOpenDate) {
      setError('Please enter the date you opened this card')
      return
    }

    try {
      await onAdd(card.id, cardOpenDate, nickname.trim() || undefined)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add card')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="panel max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Add Card</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text text-lg">
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-surface-muted border border-border">
          <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-0.5">
            {card.issuer}
          </p>
          <p className="text-sm font-medium">{card.name}</p>
          {card.benefits.length > 0 && (
            <p className="text-xs text-text-muted mt-2">
              {card.benefits.length} benefits
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1">
              Card Nickname (Optional)
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Business Card"
              className="input"
            />
            <p className="text-[10px] text-text-faint mt-1">
              Helpful if you have multiple cards of the same type.
            </p>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1">
              Card Open Date
            </label>
            <input
              type="date"
              value={cardOpenDate}
              onChange={(e) => setCardOpenDate(e.target.value)}
              className="input"
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-[10px] text-text-faint mt-1">
              When did you open this card? This is used for card anniversary benefits.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add to My Cards'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
