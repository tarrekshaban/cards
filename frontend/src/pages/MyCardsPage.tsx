import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import BenefitSummary from '../components/benefits/BenefitSummary'
import YearPicker from '../components/common/YearPicker'
import ProgressBar from '../components/common/ProgressBar'
import { userCardsApi } from '../api/client'
import type { UserCardWithBenefits, CardSummary } from '../types/cards'

export default function MyCardsPage() {
  const [userCards, setUserCards] = useState<UserCardWithBenefits[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [summary, setSummary] = useState<CardSummary | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUserCards()
  }, [])

  useEffect(() => {
    if (selectedCardId) {
      loadSummary(selectedCardId, selectedYear)
    }
  }, [selectedCardId, selectedYear])

  const loadUserCards = async () => {
    try {
      const data = await userCardsApi.getUserCards()
      setUserCards(data)
      if (data.length > 0 && !selectedCardId) {
        setSelectedCardId(data[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSummary = async (userCardId: string, year: number) => {
    try {
      const data = await userCardsApi.getCardSummary(userCardId, year)
      setSummary(data)
    } catch (err) {
      console.error('Failed to load summary:', err)
    }
  }

  const handleRemoveCard = async (userCardId: string) => {
    if (!confirm('Remove this card from your profile? Redemption history will be lost.')) return
    try {
      await userCardsApi.removeUserCard(userCardId)
      setUserCards((prev) => prev.filter((uc) => uc.id !== userCardId))
      if (selectedCardId === userCardId) {
        const remaining = userCards.filter((uc) => uc.id !== userCardId)
        setSelectedCardId(remaining.length > 0 ? remaining[0].id : null)
        setSummary(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove card')
    }
  }

  const selectedCard = userCards.find((uc) => uc.id === selectedCardId)

  if (isLoading) {
    return (
      <Layout>
        <div className="panel text-center py-8">
          <p className="text-text-muted">Loading your cards...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="panel">
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Portfolio</p>
          <h1 className="text-lg font-normal">My Cards</h1>
        </div>

        {error && (
          <div className="panel border-red-900/50 bg-red-950/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {userCards.length === 0 ? (
          <div className="panel text-center py-8">
            <p className="text-text-muted">You haven't added any cards yet.</p>
            <Link to="/cards" className="btn-primary mt-4 inline-block">
              Browse Card Catalog
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Card List */}
            <div className="space-y-2">
              {userCards.map((uc) => (
                <div
                  key={uc.id}
                  onClick={() => setSelectedCardId(uc.id)}
                  className={`panel cursor-pointer transition-colors ${
                    selectedCardId === uc.id ? 'border-text' : 'hover:border-text-muted'
                  }`}
                >
                  <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-0.5">
                    {uc.card.issuer}
                  </p>
                  <p className="text-sm font-medium">
                    {uc.nickname ? `${uc.nickname} (${uc.card.name})` : uc.card.name}
                  </p>
                  <p className="text-[10px] text-text-faint mt-1">
                    Opened {new Date(uc.card_open_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Card Detail / Summary */}
            <div className="lg:col-span-2">
              {selectedCard && (
                <div className="panel">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-0.5">
                        {selectedCard.card.issuer}
                      </p>
                      <h2 className="text-lg font-medium">
                        {selectedCard.nickname ? `${selectedCard.nickname} (${selectedCard.card.name})` : selectedCard.card.name}
                      </h2>
                      <p className="text-xs text-text-muted mt-1">
                        Opened {new Date(selectedCard.card_open_date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveCard(selectedCard.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Year Picker */}
                  <div className="flex items-center justify-center mb-4 py-2 border-y border-border">
                    <YearPicker
                      value={selectedYear}
                      onChange={setSelectedYear}
                      minYear={new Date(selectedCard.card_open_date).getFullYear()}
                    />
                  </div>

                  {/* Benefits Summary */}
                  {summary ? (
                    <div>
                      {summary.benefits.map((bs) => (
                        <BenefitSummary key={bs.benefit.id} summary={bs} />
                      ))}

                      {/* Year Total */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Year Total</span>
                          <span className="text-sm">
                            ${summary.total_redeemed} of ${summary.total_available}
                          </span>
                        </div>
                        <ProgressBar
                          value={Number(summary.total_redeemed)}
                          max={Number(summary.total_available)}
                        />
                        <p className="text-[10px] text-text-faint mt-1 text-right">
                          {summary.total_available > 0
                            ? Math.round(
                                (Number(summary.total_redeemed) / Number(summary.total_available)) * 100
                              )
                            : 0}
                          % redeemed
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-text-muted text-sm">Loading summary...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
