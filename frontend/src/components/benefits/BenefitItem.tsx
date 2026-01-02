import { useState } from 'react'
import type { AvailableBenefit } from '../../types/cards'
import BenefitDetailModal from './BenefitDetailModal'

interface BenefitItemProps {
  benefit: AvailableBenefit
  onRedeem: () => void
  onUnredeem: () => void
  onUpdatePreferences?: (autoRedeem: boolean, hidden: boolean) => void
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

// Icons
const IconRepeat = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
)

const IconEyeOff = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function BenefitItem({
  benefit,
  onRedeem,
  onUnredeem,
  onUpdatePreferences,
  isLoading = false,
  showCard = true,
}: BenefitItemProps) {
  const { benefit: b, user_card, is_redeemed, resets_at, auto_redeem, hidden, amount_remaining, amount_redeemed } = benefit
  const [showDetail, setShowDetail] = useState(false)
  
  // Check if this is a partial redemption (some redeemed, some remaining)
  const isPartiallyRedeemed = amount_redeemed > 0 && amount_remaining > 0

  const handleToggleAutoRedeem = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdatePreferences?.(!auto_redeem, hidden)
  }

  const handleToggleHidden = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdatePreferences?.(auto_redeem, !hidden)
  }

  // Settings icons component (reused for mobile and desktop)
  const SettingsIcons = () => (
    <>
      <button
        onClick={handleToggleAutoRedeem}
        className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
          auto_redeem 
            ? 'bg-primary/10 text-primary hover:bg-primary/20' 
            : 'text-text-faint hover:text-text-muted hover:bg-surface-muted'
        }`}
        title={auto_redeem ? 'Auto-redeem ON' : 'Auto-redeem OFF'}
      >
        <IconRepeat size={14} />
      </button>
      <button
        onClick={handleToggleHidden}
        className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
          hidden 
            ? 'bg-surface-muted text-text-muted hover:bg-surface-muted/80' 
            : 'text-text-faint hover:text-text-muted hover:bg-surface-muted'
        }`}
        title={hidden ? 'Hidden' : 'Visible'}
      >
        <IconEyeOff size={14} />
      </button>
    </>
  )

  return (
    <div className={`panel group transition-opacity duration-200 relative ${hidden ? 'opacity-50 hover:opacity-100' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Main Info Row */}
          <div className="flex flex-col md:flex-row md:flex-wrap md:items-baseline gap-x-3 gap-y-1">
            {/* Value & Partial Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-medium text-[15px] tracking-tight">
                  ${Number(isPartiallyRedeemed ? amount_remaining : b.value)}
                </span>
                {isPartiallyRedeemed && (
                  <span className="text-[10px] text-text-faint font-mono">
                    / ${Number(b.value)}
                  </span>
                )}
              </div>
              {/* Schedule Tag - Mobile Only (next to value) */}
              <span className="md:hidden text-[9px] px-1.5 py-0.5 border border-border text-text-faint uppercase tracking-wider rounded-sm shrink-0">
                {formatSchedule(b.schedule)}
              </span>
            </div>
            
            {/* Name & Metadata */}
            <div className="flex flex-wrap items-center gap-2 mt-1 md:mt-0">
              <button 
                onClick={() => setShowDetail(true)}
                className="text-sm text-text-muted hover:text-text hover:underline transition-colors text-left"
              >
                {b.name}
              </button>
              {/* Schedule Tag - Desktop Only (in metadata row) */}
              <span className="hidden md:inline-flex text-[9px] px-1.5 py-0.5 border border-border text-text-faint uppercase tracking-wider rounded-sm shrink-0">
                {formatSchedule(b.schedule)}
              </span>
            </div>
          </div>
          
          {/* Metadata Row */}
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-text-faint">
            {showCard && (
              <span className="font-medium text-text-muted/70">
                {user_card.nickname ? `${user_card.nickname} (${user_card.card.name})` : user_card.card.name}
              </span>
            )}
            {showCard && resets_at && <span>·</span>}
            {resets_at && (
              <span>Resets {formatResetDate(resets_at)}</span>
            )}
          </div>

          {/* Progress Bar for Partial Redemption */}
          {isPartiallyRedeemed && (
            <div className="mt-3 md:mt-2 h-1 w-full md:max-w-[200px] bg-surface-muted border border-border overflow-hidden rounded-full">
              <div 
                className="h-full bg-primary/40" 
                style={{ width: `${(amount_redeemed / b.value) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Desktop Actions (Right Aligned) */}
        <div className="hidden md:flex items-center gap-1 shrink-0 self-start">
          {/* Settings Icons */}
          {onUpdatePreferences && <SettingsIcons />}
          {/* Redeem Button */}
          <button
            onClick={is_redeemed ? onUnredeem : onRedeem}
            disabled={isLoading}
            className={`text-[10px] tracking-wider font-medium px-3 py-1.5 transition-colors border ml-1 ${
              is_redeemed
                ? 'border-green-900/30 bg-green-950/10 text-green-500 hover:bg-green-950/20'
                : 'btn-primary border-transparent shadow-sm'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '...' : is_redeemed ? 'REDEEMED' : 'REDEEM'}
          </button>
        </div>

        {/* Mobile Actions (Full Width) */}
        <div className="md:hidden mt-2 pt-2 border-t border-border/50 flex items-center gap-2">
          {/* Settings Icons */}
          {onUpdatePreferences && <SettingsIcons />}
          {/* Redeem Button */}
          <button
            onClick={is_redeemed ? onUnredeem : onRedeem}
            disabled={isLoading}
            className={`flex-1 text-xs font-medium py-2 transition-colors border ${
              is_redeemed
                ? 'border-green-900/30 bg-green-950/10 text-green-500'
                : 'bg-surface-raised border-border text-text hover:bg-surface-muted'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Processing...' : is_redeemed ? 'Redeemed' : 'Redeem'}
          </button>
        </div>
      </div>

      {/* Benefit Detail Modal */}
      {showDetail && (
        <BenefitDetailModal
          benefit={benefit}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  )
}
