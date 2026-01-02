import { useState } from 'react'
import type { AvailableBenefit } from '../../types/cards'

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
const IconMore = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
)

const IconRepeat = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
)

const IconEyeOff = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

// Components
const Toggle = ({ checked }: { checked: boolean }) => (
  <div className={`relative w-7 h-3.5 border transition-colors ${checked ? 'border-primary/50 bg-primary/10' : 'border-border bg-surface-muted'}`}>
    <div className={`absolute top-0.5 left-0.5 w-2 h-2 transition-all duration-200 ${checked ? 'translate-x-3.5 bg-primary' : 'translate-x-0 bg-text-muted'}`} />
  </div>
)

export default function BenefitItem({
  benefit,
  onRedeem,
  onUnredeem,
  onUpdatePreferences,
  isLoading = false,
  showCard = true,
}: BenefitItemProps) {
  const { benefit: b, user_card, is_redeemed, resets_at, auto_redeem, hidden } = benefit
  const [menuOpen, setMenuOpen] = useState(false)

  const handleToggleAutoRedeem = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdatePreferences?.(!auto_redeem, hidden)
  }

  const handleToggleHidden = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdatePreferences?.(auto_redeem, !hidden)
  }

  return (
    <div className={`panel group transition-opacity duration-200 ${hidden ? 'opacity-50 hover:opacity-100' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium">${Number(b.value)}</span>
            <span className="text-sm text-text-muted">{b.name}</span>
            <span className="text-[9px] px-1 py-0.5 border border-border text-text-faint shrink-0">
              {formatSchedule(b.schedule)}
            </span>
            {auto_redeem && (
              <span className="text-[9px] px-1 py-0.5 border border-primary/20 bg-primary/5 text-primary shrink-0 flex items-center gap-1">
                <IconRepeat /> Auto
              </span>
            )}
            {hidden && (
              <span className="text-[9px] px-1 py-0.5 border border-border bg-surface-muted text-text-muted shrink-0 flex items-center gap-1">
                <IconEyeOff /> Hidden
              </span>
            )}
          </div>
          {showCard && (
            <p className="text-[10px] text-text-faint mt-1">
              {user_card.nickname ? `${user_card.nickname} (${user_card.card.name})` : user_card.card.name}
              {resets_at && ` · Resets ${formatResetDate(resets_at)}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Options Menu */}
          {onUpdatePreferences && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`flex items-center justify-center w-6 h-6 rounded hover:bg-surface-muted text-text-muted hover:text-text transition-colors ${menuOpen ? 'bg-surface-muted text-text' : ''}`}
                title="Options"
              >
                <IconMore />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-surface-raised border border-border shadow-xl min-w-[180px] p-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <button
                      onClick={handleToggleAutoRedeem}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] hover:bg-surface-muted transition-colors group rounded-sm"
                    >
                      <div className="flex items-center gap-2 text-text-muted group-hover:text-text transition-colors">
                        <span className="opacity-70"><IconRepeat /></span>
                        <span>Auto-redeem</span>
                      </div>
                      <Toggle checked={auto_redeem} />
                    </button>
                    <button
                      onClick={handleToggleHidden}
                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] hover:bg-surface-muted transition-colors group rounded-sm"
                    >
                      <div className="flex items-center gap-2 text-text-muted group-hover:text-text transition-colors">
                        <span className="opacity-70"><IconEyeOff /></span>
                        <span>Hide benefit</span>
                      </div>
                      <Toggle checked={hidden} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {/* Redeem Button */}
          <button
            onClick={is_redeemed ? onUnredeem : onRedeem}
            disabled={isLoading}
            className={`text-xs px-3 py-1.5 transition-colors font-medium border ${
              is_redeemed
                ? 'border-green-900/30 bg-green-950/10 text-green-500 hover:bg-green-950/20'
                : 'btn-primary border-transparent'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '...' : is_redeemed ? 'REDEEMED' : 'REDEEM'}
          </button>
        </div>
      </div>
    </div>
  )
}