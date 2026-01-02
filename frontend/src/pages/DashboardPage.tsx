import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import BenefitItem from '../components/benefits/BenefitItem'
import { userCardsApi } from '../api/client'
import type { AvailableBenefit, AnnualSummary } from '../types/cards'

type SortBy = 'urgency' | 'value' | 'card'

export default function DashboardPage() {
  const [benefits, setBenefits] = useState<AvailableBenefit[]>([])
  const [summary, setSummary] = useState<AnnualSummary | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('urgency')
  const [showHidden, setShowHidden] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingBenefitId, setLoadingBenefitId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [benefitsData, summaryData] = await Promise.all([
        userCardsApi.getAvailableBenefits(showHidden),
        userCardsApi.getAnnualSummary(),
      ])
      setBenefits(benefitsData)
      setSummary(summaryData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [showHidden])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRedeem = async (benefit: AvailableBenefit) => {
    setLoadingBenefitId(benefit.benefit.id)
    try {
      await userCardsApi.redeemBenefit(benefit.user_card.id, benefit.benefit.id)
      // Remove from list since it's now redeemed
      setBenefits((prev) => prev.filter((b) => b.benefit.id !== benefit.benefit.id))
      // Refresh the summary to update redeemed totals
      const updatedSummary = await userCardsApi.getAnnualSummary()
      setSummary(updatedSummary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem benefit')
    } finally {
      setLoadingBenefitId(null)
    }
  }

  const handleUpdatePreferences = async (benefit: AvailableBenefit, autoRedeem: boolean, hidden: boolean) => {
    try {
      await userCardsApi.updateBenefitPreferences(benefit.user_card.id, benefit.benefit.id, {
        auto_redeem: autoRedeem,
        hidden: hidden,
      })
      // Reload data to reflect changes
      await loadData()
      // Also refresh summary since auto-redeem affects totals
      const updatedSummary = await userCardsApi.getAnnualSummary()
      setSummary(updatedSummary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
    }
  }

  const sortedBenefits = [...benefits].sort((a, b) => {
    switch (sortBy) {
      case 'urgency':
        // Sort by reset date (soonest first)
        const dateA = a.resets_at ? new Date(a.resets_at).getTime() : Infinity
        const dateB = b.resets_at ? new Date(b.resets_at).getTime() : Infinity
        return dateA - dateB
      case 'value':
        // Sort by value (highest first)
        return b.benefit.value - a.benefit.value
      case 'card':
        // Group by card name
        return a.user_card.card.name.localeCompare(b.user_card.card.name)
      default:
        return 0
    }
  })


  if (isLoading) {
    return (
      <Layout>
        <div className="panel text-center py-8">
          <p className="text-text-muted">Loading benefits...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Annual Summary */}
        {summary && (
          <div className="panel">
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-3">
              {summary.year} Annual Summary
            </p>
            <div className="flex items-end justify-between gap-4 mb-3">
              <div>
                <p className="text-2xl font-medium">
                  ${Number(summary.total_redeemed).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-text-faint">redeemed</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-medium text-text-muted">
                  ${Number(summary.outstanding).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-text-faint">outstanding</p>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="h-2 bg-surface-muted border border-border overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${summary.total_available > 0 ? (Number(summary.total_redeemed) / Number(summary.total_available)) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-[9px] text-text-faint">
                {summary.redeemed_count} of {summary.total_count} benefits
              </p>
              <p className="text-[9px] text-text-faint">
                ${Number(summary.total_available).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total
              </p>
            </div>
          </div>
        )}


        {error && (
          <div className="panel border-red-900/50 bg-red-950/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {benefits.length === 0 ? (
          <div className="panel text-center py-8">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-text-muted">All caught up!</p>
            <p className="text-xs text-text-faint mt-1">
              You've redeemed all available benefits.
            </p>
            <Link to="/cards" className="btn-secondary mt-4 inline-block">
              Add More Cards
            </Link>
          </div>
        ) : (
          <>
            {/* Sort Options and Filters */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-faint">Sort by:</span>
                {(['urgency', 'value', 'card'] as SortBy[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`text-[10px] px-2 py-0.5 transition-colors ${
                      sortBy === option
                        ? 'bg-surface-raised border border-text-muted text-text'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {option === 'urgency' ? 'Urgency' : option === 'value' ? 'Value' : 'Card'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowHidden(!showHidden)}
                className={`text-[10px] px-2 py-0.5 transition-colors ${
                  showHidden
                    ? 'bg-surface-raised border border-text-muted text-text'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {showHidden ? 'Hide hidden' : 'Show hidden'}
              </button>
            </div>

            {/* Benefits List */}
            <div className="space-y-2">
              {sortedBenefits.map((benefit) => (
                <BenefitItem
                  key={`${benefit.user_card.id}-${benefit.benefit.id}`}
                  benefit={benefit}
                  onRedeem={() => handleRedeem(benefit)}
                  onUnredeem={() => {}} // Not used on dashboard
                  onUpdatePreferences={(autoRedeem, hidden) => handleUpdatePreferences(benefit, autoRedeem, hidden)}
                  isLoading={loadingBenefitId === benefit.benefit.id}
                  showCard={true}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
