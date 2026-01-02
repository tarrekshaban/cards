import { useState } from 'react'
import type { AvailableBenefit } from '../../types/cards'

interface RedeemModalProps {
  benefit: AvailableBenefit
  onConfirm: (amount: number) => Promise<void>
  onClose: () => void
  isLoading?: boolean
}

export default function RedeemModal({
  benefit,
  onConfirm,
  onClose,
  isLoading = false,
}: RedeemModalProps) {
  const { benefit: b, user_card, amount_remaining } = benefit
  const [amount, setAmount] = useState(amount_remaining)
  const [error, setError] = useState('')

  const hasPartialRedemption = benefit.amount_redeemed > 0

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0
    setAmount(Math.min(Math.max(0, value), amount_remaining))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (amount <= 0) {
      setError('Amount must be greater than $0')
      return
    }

    if (amount > amount_remaining) {
      setError(`Amount cannot exceed $${amount_remaining}`)
      return
    }

    try {
      await onConfirm(amount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="panel max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Redeem</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text text-lg"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Benefit Info */}
        <div className="mb-4 p-3 bg-surface-muted border border-border">
          <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-0.5">
            {user_card.nickname
              ? `${user_card.nickname} · ${user_card.card.name}`
              : user_card.card.name}
          </p>
          <p className="text-sm font-medium">{b.name}</p>
          {hasPartialRedemption && (
            <p className="text-xs text-text-muted mt-2">
              ${benefit.amount_redeemed} already redeemed
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1">
              Amount to Redeem
            </label>
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-sm">$</span>
              <input
                type="number"
                min={0}
                max={amount_remaining}
                step={0.01}
                inputMode="decimal"
                value={amount}
                onChange={handleInputChange}
                className="input flex-1 text-lg"
                autoFocus
              />
              <span className="text-xs text-text-faint whitespace-nowrap">
                of ${amount_remaining}
              </span>
            </div>
          </div>

          {/* Presets - Removed */}
          {/* <div className="flex gap-1">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePreset(pct)}
                className={`flex-1 text-[10px] py-1.5 border transition-colors ${
                  amount === Math.round(amount_remaining * pct * 100) / 100
                    ? 'border-text-muted bg-surface-raised text-text'
                    : 'border-border text-text-muted hover:text-text hover:border-text-muted'
                }`}
              >
                {pct === 1 ? 'Full' : `${pct * 100}%`}
              </button>
            ))}
          </div> */}

          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* Actions */}
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
              disabled={isLoading || amount <= 0}
            >
              {isLoading ? 'Redeeming...' : `Redeem $${amount}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
