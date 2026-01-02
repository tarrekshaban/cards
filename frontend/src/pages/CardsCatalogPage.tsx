import { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import CardTile from '../components/cards/CardTile'
import AddCardModal from '../components/cards/AddCardModal'
import { cardsApi, userCardsApi } from '../api/client'
import type { Card, CardWithBenefits } from '../types/cards'

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

  const handleAddCard = async (cardId: string, cardOpenDate: string, nickname?: string) => {
    setIsAdding(true)
    try {
      await userCardsApi.addUserCard({ card_id: cardId, card_open_date: cardOpenDate, nickname })
      setUserCardIds((prev) => new Set([...prev, cardId]))
      setSelectedCard(null)
    } finally {
      setIsAdding(false)
    }
  }

  // Allow adding multiple cards: don't filter out owned cards from the main list
  // But we might want to indicate which ones are already owned.
  // For now, let's just show all cards in one list to simplify "adding another one"
  const sortedCards = [...cards].sort((a, b) => {
    const aOwned = userCardIds.has(a.id)
    const bOwned = userCardIds.has(b.id)
    if (aOwned === bOwned) return 0
    return aOwned ? 1 : -1 // Move owned to bottom? Or keep alphabetical?
  })
  
  // Actually, keeping the split is confusing if we can add duplicates. 
  // Let's just list all cards and show a badge if owned.

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
          <div className="grid gap-2 sm:grid-cols-2">
            {cards.map((card) => {
              const isOwned = userCardIds.has(card.id)
              return (
                <div key={card.id} className="relative">
                  <CardTile
                    card={card}
                    onClick={() => handleCardClick(card)}
                    selected={false}
                  />
                  {isOwned && (
                    <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 border border-green-900/50 bg-green-950/20 text-green-400 pointer-events-none">
                      OWNED
                    </span>
                  )}
                </div>
              )
            })}
          </div>
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
