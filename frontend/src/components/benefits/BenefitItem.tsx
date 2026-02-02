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

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatResetDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const date = parseLocalDate(dateStr)
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
  const resetLabel = resets_at ? `Resets ${formatResetDate(resets_at)}` : null
  const scheduleLabel = formatSchedule(b.schedule)

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
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
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
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
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
    <div className={`panel group relative overflow-hidden rounded-2xl border-border/70 bg-gradient-to-br from-surface-raised via-surface-muted/60 to-surface-raised shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out active:scale-[0.99] ${hidden ? 'opacity-60 hover:opacity-100' : ''}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(229,229,229,0.08),transparent_65%)]" />
      <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Main Info Row */}
          <div className="flex flex-col gap-2">
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
            </div>
            
            {/* Name & Metadata */}
            <button 
              onClick={() => setShowDetail(true)}
              className="text-sm text-text-muted hover:text-text hover:underline transition-colors text-left"
            >
              {b.name}
            </button>
          </div>
          
          {/* Metadata Row */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-text-faint">
            {showCard && (
              <span className="font-medium text-text-muted/70">
                {user_card.nickname ? `${user_card.nickname} (${user_card.card.name})` : user_card.card.name}
              </span>
            )}
            <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-1 border border-border/60 rounded-full bg-surface-muted/40">
              {scheduleLabel}
            </span>
            {resetLabel && (
              <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-1 border border-border/60 rounded-full bg-surface-muted/40">
                {resetLabel}
              </span>
            )}
          </div>

          {/* Progress Bar for Partial Redemption */}
          {isPartiallyRedeemed && (
            <div className="mt-3 md:mt-2 h-1.5 w-full md:max-w-[240px] bg-surface-muted/70 border border-border/60 overflow-hidden rounded-full">
              <div 
                className="h-full bg-primary/50" 
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
        <div className="md:hidden mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
          {/* Settings Icons */}
          {onUpdatePreferences && <SettingsIcons />}
          {/* Redeem Button */}
          <button
            onClick={is_redeemed ? onUnredeem : onRedeem}
            disabled={isLoading}
            className={`flex-1 text-xs font-medium py-2.5 transition-colors border rounded-full ${
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
