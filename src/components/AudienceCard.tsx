import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AudienceCard as AudienceCardData } from '../data/homepage'
import { ImageWithFallback } from './ImageWithFallback'

export function AudienceCard({ card }: { card: AudienceCardData }) {
  const Icon = card.icon

  return (
    <article className="audience-card">
      <ImageWithFallback className="audience-image" src={card.imageUrl} alt={card.imageAlt} fallbackIcon={Icon} />
      <div className="audience-content">
        <span className="audience-label">{card.audience}</span>
        <h3>{card.title}</h3>
        <p>{card.description}</p>
        <Link to={`/products?category=${card.category}`} aria-label={`Browse ${card.category.replaceAll('-', ' ')} for ${card.audience.toLowerCase()}`}>
          Explore options <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
