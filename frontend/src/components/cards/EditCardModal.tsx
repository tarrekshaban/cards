import { useState } from 'react'
import type { UserCard } from '../../types/cards'

interface EditCardModalProps {
  userCard: UserCard
  onClose: () => void
  onSave: (userCardId: string, nickname: string, cardOpenDate: string) => Promise<void>
  isLoading?: boolean
}

export default function EditCardModal({ userCard, onClose, onSave, isLoading = false }: EditCardModalProps) {
  const [nickname, setNickname] = useState(userCard.nickname || '')
  const [cardOpenDate, setCardOpenDate] = useState(userCard.card_open_date)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!cardOpenDate) {
      setError('Please enter the date you opened this card')
      return
    }

    try {
      await onSave(userCard.id, nickname.trim(), cardOpenDate)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="panel max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Edit Card</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text text-lg">
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-surface-muted border border-border">
          <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-0.5">
            {userCard.card.issuer}
          </p>
          <p className="text-sm font-medium">{userCard.card.name}</p>
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
              autoCapitalize="words"
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
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
