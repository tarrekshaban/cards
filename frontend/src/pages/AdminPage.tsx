import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import CardForm from '../components/admin/CardForm'
import BenefitForm from '../components/admin/BenefitForm'
import { cardsApi, adminApi } from '../api/client'
import type { Card, CardWithBenefits, Benefit, CreateCardRequest, CreateBenefitRequest } from '../types/cards'

type View = 'list' | 'new-card' | 'edit-card' | 'card-detail' | 'new-benefit' | 'edit-benefit'

export default function AdminPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<CardWithBenefits | null>(null)
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null)
  const [view, setView] = useState<View>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCards()
  }, [])

  const loadCards = async () => {
    try {
      const data = await cardsApi.getCards()
      setCards(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards')
    }
  }

  const loadCardDetail = async (cardId: string) => {
    try {
      const data = await adminApi.getCardWithBenefits(cardId)
      setSelectedCard(data)
      setView('card-detail')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load card')
    }
  }

  const handleCreateCard = async (data: CreateCardRequest) => {
    setIsLoading(true)
    try {
      await adminApi.createCard(data)
      await loadCards()
      setView('list')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateCard = async (data: CreateCardRequest) => {
    if (!selectedCard) return
    setIsLoading(true)
    try {
      await adminApi.updateCard(selectedCard.id, data)
      await loadCards()
      await loadCardDetail(selectedCard.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Delete this card? This will also delete all its benefits.')) return
    setIsLoading(true)
    try {
      await adminApi.deleteCard(cardId)
      await loadCards()
      setSelectedCard(null)
      setView('list')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBenefit = async (data: CreateBenefitRequest) => {
    if (!selectedCard) return
    setIsLoading(true)
    try {
      await adminApi.createBenefit(selectedCard.id, data)
      await loadCardDetail(selectedCard.id)
      setView('card-detail')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateBenefit = async (data: CreateBenefitRequest) => {
    if (!selectedBenefit || !selectedCard) return
    setIsLoading(true)
    try {
      await adminApi.updateBenefit(selectedBenefit.id, data)
      await loadCardDetail(selectedCard.id)
      setView('card-detail')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBenefit = async (benefitId: string) => {
    if (!selectedCard) return
    if (!confirm('Delete this benefit?')) return
    setIsLoading(true)
    try {
      await adminApi.deleteBenefit(benefitId)
      await loadCardDetail(selectedCard.id)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="panel flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Admin</p>
            <h1 className="text-lg font-normal">Card Catalog</h1>
          </div>
          {view === 'list' && (
            <button onClick={() => setView('new-card')} className="btn-primary">
              + New Card
            </button>
          )}
          {view !== 'list' && (
            <button
              onClick={() => {
                if (view === 'card-detail') {
                  setSelectedCard(null)
                  setView('list')
                } else if (view === 'new-benefit' || view === 'edit-benefit') {
                  setSelectedBenefit(null)
                  setView('card-detail')
                } else {
                  setView('list')
                }
              }}
              className="btn-secondary"
            >
              ← Back
            </button>
          )}
        </div>

        {error && (
          <div className="panel border-red-900/50 bg-red-950/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Card List */}
        {view === 'list' && (
          <div className="space-y-2">
            {cards.length === 0 ? (
              <div className="panel text-center py-8">
                <p className="text-text-muted">No cards in catalog yet.</p>
                <button onClick={() => setView('new-card')} className="btn-primary mt-4">
                  Create your first card
                </button>
              </div>
            ) : (
              cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => loadCardDetail(card.id)}
                  className="panel cursor-pointer hover:border-text-muted transition-colors"
                >
                  <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-0.5">
                    {card.issuer}
                  </p>
                  <p className="text-sm font-medium">{card.name}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* New Card Form */}
        {view === 'new-card' && (
          <div className="panel">
            <h2 className="text-sm font-medium mb-4">New Card</h2>
            <CardForm
              onSubmit={handleCreateCard}
              onCancel={() => setView('list')}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Edit Card Form */}
        {view === 'edit-card' && selectedCard && (
          <div className="panel">
            <h2 className="text-sm font-medium mb-4">Edit Card</h2>
            <CardForm
              card={selectedCard}
              onSubmit={handleUpdateCard}
              onCancel={() => setView('card-detail')}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Card Detail with Benefits */}
        {view === 'card-detail' && selectedCard && (
          <div className="space-y-4">
            <div className="panel">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-0.5">
                    {selectedCard.issuer}
                  </p>
                  <h2 className="text-lg font-medium">{selectedCard.name}</h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setView('edit-card')} className="btn-secondary text-xs">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCard(selectedCard.id)}
                    className="btn-secondary text-xs text-red-400 border-red-900/50 hover:bg-red-950/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Benefits</h3>
                <button onClick={() => setView('new-benefit')} className="btn-secondary text-xs">
                  + Add Benefit
                </button>
              </div>

              {selectedCard.benefits.length === 0 ? (
                <p className="text-text-muted text-sm">No benefits yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCard.benefits.map((benefit) => (
                    <div
                      key={benefit.id}
                      className="p-3 bg-surface-muted border border-border flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">${benefit.value}</span>
                          <span className="text-sm text-text-muted">{benefit.name}</span>
                          <span className="text-[9px] px-1 py-0.5 border border-border text-text-faint">
                            {benefit.schedule}
                          </span>
                        </div>
                        {benefit.description && (
                          <p className="text-xs text-text-faint mt-1">{benefit.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedBenefit(benefit)
                            setView('edit-benefit')
                          }}
                          className="text-xs text-text-muted hover:text-text"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBenefit(benefit.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* New Benefit Form */}
        {view === 'new-benefit' && selectedCard && (
          <div className="panel">
            <h2 className="text-sm font-medium mb-4">Add Benefit to {selectedCard.name}</h2>
            <BenefitForm
              onSubmit={handleCreateBenefit}
              onCancel={() => setView('card-detail')}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Edit Benefit Form */}
        {view === 'edit-benefit' && selectedBenefit && (
          <div className="panel">
            <h2 className="text-sm font-medium mb-4">Edit Benefit</h2>
            <BenefitForm
              benefit={selectedBenefit}
              onSubmit={handleUpdateBenefit}
              onCancel={() => {
                setSelectedBenefit(null)
                setView('card-detail')
              }}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </Layout>
  )
}
