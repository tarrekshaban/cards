import type { AvailableBenefit } from '../../types/cards'

interface BenefitItemProps {
  benefit: AvailableBenefit
  onRedeem: () => void
  onUnredeem: () => void
  isLoading?: boolean
  showCard?: boolean
}

function formatResetDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatSchedule(schedule: string): string {
  switch (schedule) {
    case 'calendar_year':
      return 'Annual'
    case 'card_year':
      return 'Card Year'
    case 'monthly':
      return 'Monthly'
    case 'quarterly':
      return 'Quarterly'
    case 'one_time':
      return 'One-time'
    default:
      return schedule
  }
}

export default function BenefitItem({
  benefit,
  onRedeem,
  onUnredeem,
  isLoading = false,
  showCard = true,
}: BenefitItemProps) {
  const { benefit: b, user_card, is_redeemed, resets_at } = benefit

  return (
    <div className="panel flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">${b.value}</span>
          <span className="text-sm text-text-muted truncate">{b.name}</span>
          <span className="text-[9px] px-1 py-0.5 border border-border text-text-faint">
            {formatSchedule(b.schedule)}
          </span>
        </div>
        {showCard && (
          <p className="text-[10px] text-text-faint mt-0.5">
            {user_card.card.name}
            {resets_at && ` · resets ${formatResetDate(resets_at)}`}
          </p>
        )}
      </div>
      <button
        onClick={is_redeemed ? onUnredeem : onRedeem}
        disabled={isLoading}
        className={`text-xs px-3 py-1 transition-colors ${
          is_redeemed
            ? 'border border-green-900/50 bg-green-950/20 text-green-400 hover:bg-green-950/40'
            : 'btn-primary'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? '...' : is_redeemed ? 'REDEEMED' : 'REDEEM'}
      </button>
    </div>
  )
}
