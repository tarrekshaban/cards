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
      return 'annual'
    case 'card_year':
      return 'card year'
    case 'one_time':
      return 'one-time'
    default:
      return schedule
  }
}

export default function BenefitSummary({ summary }: BenefitSummaryProps) {
  const { benefit, redeemed_count, total_count, redeemed_value, total_value } = summary
  const percentage = total_count > 0 ? Math.round((redeemed_count / total_count) * 100) : 0
  
  // Is this benefit fully redeemed?
  const isFullyRedeemed = redeemed_count >= total_count && total_count > 0

  return (
    <div className={`py-3 border-b border-border last:border-b-0 ${isFullyRedeemed ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-medium">
            ${Number(benefit.value).toLocaleString()}
          </span>
          <span className="text-sm font-medium">{benefit.name}</span>
          <span className="text-[9px] uppercase tracking-wider text-text-faint px-1.5 py-0.5 border border-border rounded-sm">
            {formatSchedule(benefit.schedule)}
          </span>
        </div>
        <div className="text-right">
           <span className={`text-xs font-mono ${isFullyRedeemed ? 'text-green-400' : 'text-text-muted'}`}>
             ${redeemed_value}
           </span>
           <span className="text-[10px] text-text-faint ml-1">
             / ${total_value}
           </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 mt-2">
        <ProgressBar 
          value={redeemed_count} 
          max={total_count} 
          className={`flex-1 h-1.5 ${isFullyRedeemed ? 'bg-green-900/20' : ''}`}
        />
        <span className={`text-[10px] w-8 text-right ${isFullyRedeemed ? 'text-green-400' : 'text-text-faint'}`}>
          {percentage}%
        </span>
      </div>
    </div>
  )
}
