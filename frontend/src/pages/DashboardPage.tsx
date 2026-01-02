import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import BenefitItem from '../components/benefits/BenefitItem'
import { userCardsApi } from '../api/client'
import type { AvailableBenefit } from '../types/cards'

type SortBy = 'urgency' | 'value' | 'card'

export default function DashboardPage() {
  const [benefits, setBenefits] = useState<AvailableBenefit[]>([])
  const [sortBy, setSortBy] = useState<SortBy>('urgency')
  const [isLoading, setIsLoading] = useState(true)
  const [loadingBenefitId, setLoadingBenefitId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBenefits()
  }, [])

  const loadBenefits = async () => {
    try {
      const data = await userCardsApi.getAvailableBenefits()
      setBenefits(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load benefits')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedeem = async (benefit: AvailableBenefit) => {
    setLoadingBenefitId(benefit.benefit.id)
    try {
      await userCardsApi.redeemBenefit(benefit.user_card.id, benefit.benefit.id)
      // Remove from list since it's now redeemed
      setBenefits((prev) => prev.filter((b) => b.benefit.id !== benefit.benefit.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem benefit')
    } finally {
      setLoadingBenefitId(null)
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

  // Calculate total available value
  const totalValue = benefits.reduce((sum, b) => sum + b.benefit.value, 0)

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
        <div className="panel flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Dashboard</p>
            <h1 className="text-lg font-normal">Benefits to Redeem</h1>
          </div>
          {benefits.length > 0 && (
            <div className="text-right">
              <p className="text-lg font-medium">${totalValue}</p>
              <p className="text-[10px] text-text-muted">{benefits.length} available</p>
            </div>
          )}
        </div>

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
            {/* Sort Options */}
            <div className="flex items-center gap-2 px-1">
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

            {/* Benefits List */}
            <div className="space-y-2">
              {sortedBenefits.map((benefit) => (
                <BenefitItem
                  key={`${benefit.user_card.id}-${benefit.benefit.id}`}
                  benefit={benefit}
                  onRedeem={() => handleRedeem(benefit)}
                  onUnredeem={() => {}} // Not used on dashboard
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
