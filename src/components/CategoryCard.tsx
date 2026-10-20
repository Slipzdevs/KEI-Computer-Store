import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ShopCategory } from '../data/homepage'
import { ImageWithFallback } from './ImageWithFallback'

type CategoryCardData = Omit<ShopCategory, 'slug'> & { slug: string; imageUrl?: string }

export function CategoryCard({ category }: { category: CategoryCardData }) {
  const Icon = category.icon

  return (
    <Link className="category-card" to={`/products?category=${category.slug}`}>
      {category.imageUrl ? <ImageWithFallback className="category-card-image" src={category.imageUrl} alt="" fallbackIcon={Icon} /> : <span className="category-card-icon"><Icon size={25} strokeWidth={1.7} aria-hidden="true" /></span>}
      <span className="category-card-copy"><strong>{category.title}</strong><small>{category.description}</small></span>
      <ArrowUpRight className="category-card-arrow" size={17} aria-hidden="true" />
    </Link>
  )
}
