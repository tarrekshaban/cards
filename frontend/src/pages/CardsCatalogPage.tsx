import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import CardTile from '../components/cards/CardTile'
import AddCardModal from '../components/cards/AddCardModal'
import { cardsApi, userCardsApi } from '../api/client'
import type { Card, CardWithBenefits, UserCard } from '../types/cards'

export default function CardsCatalogPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [userCardIds, setUserCardIds] = useState<Set<string>>(new Set())
  const [selectedCard, setSelectedCard] = useState<CardWithBenefits | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [cardsData, userCardsData] = await Promise.all([
        cardsApi.getCards(),
        userCardsApi.getUserCards(),
      ])
      setCards(cardsData)
      setUserCardIds(new Set(userCardsData.map((uc) => uc.card_id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardClick = async (card: Card) => {
    try {
      const fullCard = await cardsApi.getCard(card.id)
      setSelectedCard(fullCard)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load card details')
    }
  }

  const handleAddCard = async (cardId: string, cardOpenDate: string) => {
    setIsAdding(true)
    try {
      await userCardsApi.addUserCard({ card_id: cardId, card_open_date: cardOpenDate })
      setUserCardIds((prev) => new Set([...prev, cardId]))
      setSelectedCard(null)
    } finally {
      setIsAdding(false)
    }
  }

  const availableCards = cards.filter((c) => !userCardIds.has(c.id))
  const ownedCards = cards.filter((c) => userCardIds.has(c.id))

  if (isLoading) {
    return (
      <Layout>
        <div className="panel text-center py-8">
          <p className="text-text-muted">Loading cards...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="panel">
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Browse</p>
          <h1 className="text-lg font-normal">Card Catalog</h1>
        </div>

        {error && (
          <div className="panel border-red-900/50 bg-red-950/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {cards.length === 0 ? (
          <div className="panel text-center py-8">
            <p className="text-text-muted">No cards in the catalog yet.</p>
            <p className="text-xs text-text-faint mt-1">
              Ask an admin to add some cards.
            </p>
          </div>
        ) : (
          <>
            {/* Available Cards */}
            {availableCards.length > 0 && (
              <div>
                <h2 className="text-xs text-text-muted mb-2 px-1">
                  Available to Add ({availableCards.length})
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableCards.map((card) => (
                    <CardTile
                      key={card.id}
                      card={card}
                      onClick={() => handleCardClick(card)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Already Owned */}
            {ownedCards.length > 0 && (
              <div>
                <h2 className="text-xs text-text-muted mb-2 px-1">
                  Already in My Cards ({ownedCards.length})
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ownedCards.map((card) => (
                    <div key={card.id} className="panel opacity-50">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-0.5">
                        {card.issuer}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm">{card.name}</p>
                        <span className="text-[9px] px-1.5 py-0.5 border border-green-900/50 bg-green-950/20 text-green-400">
                          ADDED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Add Card Modal */}
        {selectedCard && (
          <AddCardModal
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onAdd={handleAddCard}
            isLoading={isAdding}
          />
        )}
      </div>
    </Layout>
  )
}
