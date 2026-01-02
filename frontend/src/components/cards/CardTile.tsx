import type { Card, CardWithBenefits } from '../../types/cards'

interface CardTileProps {
  card: Card | CardWithBenefits
  onClick?: () => void
  selected?: boolean
  benefitCount?: number
}

export default function CardTile({ card, onClick, selected = false, benefitCount }: CardTileProps) {
  const benefits = 'benefits' in card ? card.benefits : []
  const count = benefitCount ?? benefits.length

  return (
    <div
      onClick={onClick}
      className={`panel cursor-pointer transition-colors hover:border-text-muted ${
        selected ? 'border-text' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-text-faint mb-0.5">
            {card.issuer}
          </p>
          <h3 className="text-sm font-medium">{card.name}</h3>
        </div>
        {count > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 border border-border text-text-muted">
            {count} benefits
          </span>
        )}
      </div>
    </div>
  )
}
