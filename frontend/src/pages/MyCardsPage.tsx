import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import BenefitSummary from '../components/benefits/BenefitSummary'
import EditCardModal from '../components/cards/EditCardModal'
import { userCardsApi } from '../api/client'
import type { UserCardWithBenefits, CardSummary } from '../types/cards'

export default function MyCardsPage() {
  const [userCards, setUserCards] = useState<UserCardWithBenefits[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [summary, setSummary] = useState<CardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    loadUserCards()
  }, [])

  useEffect(() => {
    if (selectedCardId) {
      loadSummary(selectedCardId, currentYear)
    }
  }, [selectedCardId, currentYear])

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

  const handleEditCard = async (userCardId: string, nickname: string, cardOpenDate: string) => {
    setIsSaving(true)
    try {
      const updated = await userCardsApi.updateUserCard(userCardId, {
        nickname: nickname || undefined,
        card_open_date: cardOpenDate,
      })
      // Update local state
      setUserCards((prev) =>
        prev.map((uc) =>
          uc.id === userCardId
            ? { ...uc, nickname: updated.nickname, card_open_date: updated.card_open_date }
            : uc
        )
      )
      // Reload summary in case the card_open_date changed
      loadSummary(userCardId, currentYear)
      setIsEditing(false)
    } catch (err) {
      throw err // Let the modal handle the error
    } finally {
      setIsSaving(false)
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

  // Calculate Net Value Stats
  const annualFee = selectedCard?.card.annual_fee || 0
  const totalRedeemed = summary?.total_redeemed || 0
  const netValue = Number(totalRedeemed) - Number(annualFee)
  const isPositiveValue = netValue >= 0

  return (
    <Layout>
      <div className="space-y-4">
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
          <div className="grid gap-4 md:grid-cols-3">
            {/* Card List */}
            <div className="space-y-2">
              {userCards.map((uc) => (
                <div
                  key={uc.id}
                  onClick={() => setSelectedCardId(uc.id)}
                  className={`panel cursor-pointer transition-all duration-200 ${
                    selectedCardId === uc.id 
                      ? 'border-text bg-surface-raised' 
                      : 'hover:border-text-muted hover:bg-surface-muted/50'
                  }`}
                >
                  <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-1">
                    {uc.card.issuer}
                  </p>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-tight">
                       {uc.nickname || uc.card.name}
                    </span>
                    {uc.nickname && (
                       <span className="text-[10px] text-text-muted mt-0.5">
                         {uc.card.name}
                       </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Card Detail / Summary */}
            <div className="md:col-span-2 space-y-4">
              {selectedCard && (
                <>
                  {/* Card Header & Net Value Scorecard */}
                  <div className="panel space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-1">
                          {selectedCard.card.issuer}
                        </p>
                        <h2 className="text-xl font-medium">
                          {selectedCard.nickname || selectedCard.card.name}
                        </h2>
                        {selectedCard.nickname && (
                          <p className="text-xs text-text-muted">{selectedCard.card.name}</p>
                        )}
                        <p className="text-[10px] text-text-faint mt-2">
                          Opened {new Date(selectedCard.card_open_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setIsEditing(true)}
                            className="text-[10px] text-text-muted hover:text-text uppercase tracking-wider"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveCard(selectedCard.id)}
                            className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="text-xs text-text-muted font-mono">{currentYear}</p>
                      </div>
                    </div>

                    {/* Net Value Scorecard */}
                    <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
                       <div>
                         <p className="text-[10px] uppercase tracking-wider text-text-faint mb-1">Annual Fee</p>
                         <p className="text-lg font-mono text-text-muted">
                           ${Number(annualFee).toLocaleString()}
                         </p>
                       </div>
                       <div>
                         <p className="text-[10px] uppercase tracking-wider text-text-faint mb-1">Redeemed</p>
                         <p className="text-lg font-mono text-primary">
                           ${Number(totalRedeemed).toLocaleString()}
                         </p>
                       </div>
                       <div>
                         <p className="text-[10px] uppercase tracking-wider text-text-faint mb-1">Net Value</p>
                         <p className={`text-lg font-mono font-medium ${isPositiveValue ? 'text-green-400' : 'text-text-muted'}`}>
                           {isPositiveValue ? '+' : ''}${netValue.toLocaleString()}
                         </p>
                       </div>
                    </div>
                  </div>

                  {/* Benefits Breakdown */}
                  {summary ? (
                    <div className="panel space-y-4">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-text-muted border-b border-border pb-2">
                        Benefit Breakdown
                      </h3>
                      
                      {summary.benefits.length === 0 ? (
                        <p className="text-sm text-text-muted py-4 text-center">No benefits found for this year.</p>
                      ) : (
                        <div className="space-y-0">
                          {/* Sort benefits by value (highest first) */}
                          {[...summary.benefits]
                            .sort((a, b) => b.benefit.value - a.benefit.value)
                            .map((bs) => (
                            <BenefitSummary key={bs.benefit.id} summary={bs} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="panel py-8 text-center">
                       <p className="text-text-muted text-sm">Loading summary...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Card Modal */}
      {isEditing && selectedCard && (
        <EditCardModal
          userCard={selectedCard}
          onClose={() => setIsEditing(false)}
          onSave={handleEditCard}
          isLoading={isSaving}
        />
      )}
    </Layout>
  )
}
