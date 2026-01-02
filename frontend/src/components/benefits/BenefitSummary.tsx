import type { BenefitSummary as BenefitSummaryType } from '../../types/cards'
import ProgressBar from '../common/ProgressBar'

interface BenefitSummaryProps {
  summary: BenefitSummaryType
}

function formatSchedule(schedule: string): string {
  switch (schedule) {
    case 'monthly':
      return 'monthly'
    case 'quarterly':
      return 'quarterly'
    case 'calendar_year':
      return 'calendar_year'
    case 'card_year':
      return 'card_year'
    case 'one_time':
      return 'one_time'
    default:
      return schedule
  }
}

export default function BenefitSummary({ summary }: BenefitSummaryProps) {
  const { benefit, redeemed_count, total_count, redeemed_value, total_value } = summary
  const percentage = total_count > 0 ? Math.round((redeemed_count / total_count) * 100) : 0

  return (
    <div className="py-3 border-b border-border last:border-b-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">${benefit.value} {benefit.name}</span>
          <span className="text-[9px] text-text-faint">({formatSchedule(benefit.schedule)})</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span>
          Redeemed: {redeemed_count} of {total_count} · ${redeemed_value} of ${total_value}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <ProgressBar value={redeemed_count} max={total_count} className="flex-1" />
        <span className="text-[10px] text-text-faint w-8">{percentage}%</span>
      </div>
    </div>
  )
}
