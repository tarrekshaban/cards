import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import CardForm from '../components/admin/CardForm'
import BenefitForm from '../components/admin/BenefitForm'
import BulkBenefitForm from '../components/admin/BulkBenefitForm'
import { cardsApi, adminApi } from '../api/client'
import type { Card, CardWithBenefits, Benefit, CreateCardRequest, UpdateCardRequest, CreateBenefitRequest, UpdateBenefitRequest, AccessCode } from '../types/cards'

type View = 'list' | 'new-card' | 'edit-card' | 'card-detail' | 'new-benefit' | 'edit-benefit' | 'bulk-benefit' | 'access-codes'

export default function AdminPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<CardWithBenefits | null>(null)
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null)
  const [view, setView] = useState<View>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Access codes state
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([])
  const [newCodeNotes, setNewCodeNotes] = useState('')

  useEffect(() => {
    loadCards()
  }, [])
  
  useEffect(() => {
    if (view === 'access-codes') {
      loadAccessCodes()
    }
  }, [view])

  const loadCards = async () => {
    try {
      const data = await cardsApi.getCards()
      setCards(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards')
    }
  }
  
  const loadAccessCodes = async () => {
    try {
      const data = await adminApi.getAccessCodes()
      setAccessCodes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load access codes')
    }
  }
  
  const handleCreateAccessCode = async () => {
    setIsLoading(true)
    try {
      await adminApi.createAccessCode({ notes: newCodeNotes.trim() || undefined })
      setNewCodeNotes('')
      await loadAccessCodes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create access code')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleInvalidateCode = async (codeId: string) => {
    if (!confirm('Invalidate this access code?')) return
    setIsLoading(true)
    try {
      await adminApi.invalidateAccessCode(codeId)
      await loadAccessCodes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invalidate access code')
    } finally {
      setIsLoading(false)
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

  const handleCreateCard = async (data: CreateCardRequest | UpdateCardRequest) => {
    setIsLoading(true)
    try {
      await adminApi.createCard(data as CreateCardRequest)
      await loadCards()
      setView('list')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateCard = async (data: CreateCardRequest | UpdateCardRequest) => {
    if (!selectedCard) return
    setIsLoading(true)
    try {
      await adminApi.updateCard(selectedCard.id, data as UpdateCardRequest)
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

  const handleCreateBenefit = async (data: CreateBenefitRequest | UpdateBenefitRequest) => {
    if (!selectedCard) return
    setIsLoading(true)
    try {
      await adminApi.createBenefit(selectedCard.id, data as CreateBenefitRequest)
      await loadCardDetail(selectedCard.id)
      setView('card-detail')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateBenefit = async (data: CreateBenefitRequest | UpdateBenefitRequest) => {
    if (!selectedBenefit || !selectedCard) return
    setIsLoading(true)
    try {
      await adminApi.updateBenefit(selectedBenefit.id, data as UpdateBenefitRequest)
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

  const handleBulkCreateBenefits = async (benefits: CreateBenefitRequest[]) => {
    if (!selectedCard) return
    setIsLoading(true)
    try {
      await adminApi.bulkCreateBenefits(selectedCard.id, benefits)
      await loadCardDetail(selectedCard.id)
      setView('card-detail')
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
            <h1 className="text-lg font-normal">
              {view === 'access-codes' ? 'Access Codes' : 'Card Catalog'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {view === 'list' && (
              <>
                <button onClick={() => setView('access-codes')} className="btn-secondary text-xs">
                  Access Codes
                </button>
                <button onClick={() => setView('new-card')} className="btn-primary">
                  + New Card
                </button>
              </>
            )}
            {view === 'access-codes' && (
              <button onClick={() => setView('list')} className="btn-secondary">
                ← Back to Cards
              </button>
            )}
          </div>
          {view !== 'list' && view !== 'access-codes' && (
            <button
              onClick={() => {
                if (view === 'card-detail') {
                  setSelectedCard(null)
                  setView('list')
                } else if (view === 'new-benefit' || view === 'edit-benefit' || view === 'bulk-benefit') {
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
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-0.5">
                        {card.issuer}
                      </p>
                      <p className="text-sm font-medium">{card.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-text-muted">
                        ${Number(card.annual_fee || 0).toLocaleString()}
                      </p>
                      <p className="text-[9px] text-text-faint">
                        {card.benefits_count || 0} benefit{card.benefits_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
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
                <div className="flex gap-2">
                  <button onClick={() => setView('bulk-benefit')} className="btn-secondary text-xs">
                    Bulk Add
                  </button>
                  <button onClick={() => setView('new-benefit')} className="btn-secondary text-xs">
                    + Add
                  </button>
                </div>
              </div>

              {selectedCard.benefits.length === 0 ? (
                <p className="text-text-muted text-sm">No benefits yet.</p>
              ) : (
                <div className="space-y-3">
                  {selectedCard.benefits.map((benefit) => (
                    <div
                      key={benefit.id}
                      className="p-3 bg-surface-muted border border-border"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-sm font-medium">${Number(benefit.value)}</span>
                            <span className="text-sm">{benefit.name}</span>
                            <span className="text-[9px] px-1 py-0.5 border border-border text-text-faint shrink-0">
                              {benefit.schedule}
                            </span>
                          </div>
                          {benefit.description && (
                            <p className="text-xs text-text-faint mt-2">{benefit.description}</p>
                          )}
                        </div>
                        <div className="flex gap-3 shrink-0">
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
                            Del
                          </button>
                        </div>
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

        {/* Bulk Add Benefits Form */}
        {view === 'bulk-benefit' && selectedCard && (
          <div className="panel">
            <h2 className="text-sm font-medium mb-4">Bulk Add Benefits to {selectedCard.name}</h2>
            <BulkBenefitForm
              onSubmit={handleBulkCreateBenefits}
              onCancel={() => setView('card-detail')}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Access Codes */}
        {view === 'access-codes' && (
          <div className="space-y-4">
            {/* Generate New Code */}
            <div className="panel">
              <h3 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Generate New Code</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCodeNotes}
                  onChange={(e) => setNewCodeNotes(e.target.value)}
                  placeholder="Notes (optional, e.g. 'For John')"
                  className="input flex-1"
                />
                <button
                  onClick={handleCreateAccessCode}
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? 'Creating...' : 'Generate'}
                </button>
              </div>
            </div>

            {/* Code List */}
            <div className="panel">
              <h3 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">
                All Codes ({accessCodes.length})
              </h3>
              {accessCodes.length === 0 ? (
                <p className="text-sm text-text-muted py-4 text-center">No access codes yet.</p>
              ) : (
                <div className="space-y-2">
                  {accessCodes.map((code) => {
                    const isUsed = !!code.used_at
                    const isInvalid = !!code.invalidated_at
                    const isActive = !isUsed && !isInvalid
                    
                    return (
                      <div
                        key={code.id}
                        className={`p-3 border border-border ${
                          isActive ? 'bg-surface-raised' : 'bg-surface-muted opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-lg tracking-wider font-medium">
                              {code.code}
                            </span>
                            {isUsed && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-green-950/30 text-green-500 border border-green-900/30 uppercase tracking-wider">
                                Used
                              </span>
                            )}
                            {isInvalid && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-red-950/30 text-red-400 border border-red-900/30 uppercase tracking-wider">
                                Invalidated
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/30 uppercase tracking-wider">
                                Active
                              </span>
                            )}
                          </div>
                          {isActive && (
                            <button
                              onClick={() => handleInvalidateCode(code.id)}
                              className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider"
                            >
                              Invalidate
                            </button>
                          )}
                        </div>
                        {code.notes && (
                          <p className="text-xs text-text-muted mt-1">{code.notes}</p>
                        )}
                        <p className="text-[10px] text-text-faint mt-1">
                          Created {code.created_at ? new Date(code.created_at).toLocaleDateString() : 'Unknown'}
                          {isUsed && code.used_at && (
                            <> · Used {new Date(code.used_at).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
