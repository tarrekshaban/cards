import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import BenefitItem from '../components/benefits/BenefitItem'
import RedeemModal from '../components/benefits/RedeemModal'
import { userCardsApi } from '../api/client'
import type { AvailableBenefit, AnnualSummary } from '../types/cards'

export default function DashboardPage() {
  const [benefits, setBenefits] = useState<AvailableBenefit[]>([])
  const [summary, setSummary] = useState<AnnualSummary | null>(null)
  const [showHidden, setShowHidden] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedBenefit, setSelectedBenefit] = useState<AvailableBenefit | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)

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

  // Open the redeem modal for a benefit
  const handleOpenRedeemModal = (benefit: AvailableBenefit) => {
    setSelectedBenefit(benefit)
  }

  // Confirm and process the redemption
  const handleConfirmRedeem = async (amount: number) => {
    if (!selectedBenefit) return

    setIsRedeeming(true)
    try {
      await userCardsApi.redeemBenefit(selectedBenefit.user_card.id, selectedBenefit.benefit.id, amount)
      
      // Reload data to reflect changes (benefit may still be in list if partial)
      await loadData()
      
      // Refresh summary
      const updatedSummary = await userCardsApi.getAnnualSummary()
      setSummary(updatedSummary)
      
      // Close modal
      setSelectedBenefit(null)
    } catch (err) {
      throw err // Let the modal handle the error display
    } finally {
      setIsRedeeming(false)
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

  // Group benefits by card
  const groupedBenefits = benefits.reduce((acc, benefit) => {
    const cardId = benefit.user_card.id
    if (!acc[cardId]) {
      acc[cardId] = {
        userCard: benefit.user_card,
        benefits: []
      }
    }
    acc[cardId].benefits.push(benefit)
    return acc
  }, {} as Record<string, { userCard: typeof benefits[0]['user_card'], benefits: typeof benefits }>)

  // Sort groups by card name
  const sortedGroups = Object.values(groupedBenefits).sort((a, b) => {
    const nameA = a.userCard.nickname || a.userCard.card.name
    const nameB = b.userCard.nickname || b.userCard.card.name
    return nameA.localeCompare(nameB)
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
                ${Number(summary.total_annual_fees).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} annual fees
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
            {/* Benefits List */}
            <div className="space-y-6">
              {sortedGroups.map((group) => (
                <div key={group.userCard.id} className="space-y-2">
                  <div className="flex items-baseline gap-2 px-1">
                    <h2 className="text-sm font-medium text-text-muted">
                      {group.userCard.card.name}
                    </h2>
                    {group.userCard.nickname && (
                      <span className="text-xs text-text-faint">
                        {group.userCard.nickname}
                      </span>
                    )}
                    <div className="ml-auto text-xs font-mono text-text-muted">
                      ${group.benefits.reduce((sum, b) => {
                        // Use amount_remaining if present (partial/full redemption logic handled by backend)
                        // If auto-redeem is on, backend sets amount_remaining to 0, so this works.
                        const val = b.amount_remaining !== undefined ? b.amount_remaining : b.benefit.value
                        return sum + Number(val)
                      }, 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {group.benefits.map((benefit) => (
                      <BenefitItem
                        key={`${benefit.user_card.id}-${benefit.benefit.id}`}
                        benefit={benefit}
                        onRedeem={() => handleOpenRedeemModal(benefit)}
                        onUnredeem={() => {}} // Not used on dashboard
                        onUpdatePreferences={(autoRedeem, hidden) => handleUpdatePreferences(benefit, autoRedeem, hidden)}
                        showCard={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Show Hidden Toggle */}
            <div className="text-center">
              <button
                onClick={() => setShowHidden(!showHidden)}
                className={`text-[10px] px-3 py-1 transition-colors ${
                  showHidden
                    ? 'bg-surface-raised border border-text-muted text-text'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {showHidden ? 'Hide hidden' : 'Show hidden'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Redeem Modal */}
      {selectedBenefit && (
        <RedeemModal
          benefit={selectedBenefit}
          onConfirm={handleConfirmRedeem}
          onClose={() => setSelectedBenefit(null)}
          isLoading={isRedeeming}
        />
      )}
    </Layout>
  )
}
