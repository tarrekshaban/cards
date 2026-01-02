import type { AvailableBenefit } from '../../types/cards'

interface BenefitDetailModalProps {
  benefit: AvailableBenefit
  onClose: () => void
}

function formatSchedule(schedule: string): string {
  switch (schedule) {
    case 'calendar_year':
      return 'Calendar Year'
    case 'card_year':
      return 'Card Anniversary Year'
    case 'monthly':
      return 'Monthly'
    case 'quarterly':
      return 'Quarterly'
    case 'biannual':
      return 'Twice per Year'
    case 'one_time':
      return 'One-time'
    default:
      return schedule
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function BenefitDetailModal({ benefit, onClose }: BenefitDetailModalProps) {
  const { benefit: b, user_card, is_redeemed, resets_at, auto_redeem, hidden, amount_remaining } = benefit
  
  const totalValue = Number(b.value)
  const remaining = Number(amount_remaining)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="panel max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-1">
              Benefit Details
            </p>
            <h2 className="text-lg font-medium">{b.name}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-text-muted hover:text-text text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Card Info */}
        <div className="p-3 bg-surface-muted border border-border mb-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-0.5">
            {user_card.card.issuer}
          </p>
          <p className="text-sm font-medium">
            {user_card.nickname ? `${user_card.nickname} (${user_card.card.name})` : user_card.card.name}
          </p>
        </div>

        {/* Description */}
        {b.description && (
          <div className="mb-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-1">Description</p>
            <p className="text-sm text-text-muted">{b.description}</p>
          </div>
        )}

        {/* Value & Progress */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-1">Total Value</p>
            <p className="text-xl font-mono font-medium">${totalValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-1">Schedule</p>
            <p className="text-sm">{formatSchedule(b.schedule)}</p>
          </div>
        </div>

        {/* Status & Settings */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-1">Status</p>
            <p className={`text-sm font-medium ${is_redeemed ? 'text-green-500' : 'text-text'}`}>
              {is_redeemed ? 'Fully Redeemed' : remaining < totalValue ? 'Partially Redeemed' : 'Available'}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-1">Resets</p>
            <p className="text-sm text-text-muted">{formatDate(resets_at)}</p>
          </div>
        </div>

        {/* Settings Indicators */}
        <div className="flex gap-3 mb-4">
          {auto_redeem && (
            <span className="text-[10px] px-2 py-1 border border-primary/30 bg-primary/10 text-primary rounded-sm">
              Auto-redeem enabled
            </span>
          )}
          {hidden && (
            <span className="text-[10px] px-2 py-1 border border-border bg-surface-muted text-text-muted rounded-sm">
              Hidden from dashboard
            </span>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full btn-secondary text-sm"
        >
          Close
        </button>
      </div>
    </div>
  )
}
