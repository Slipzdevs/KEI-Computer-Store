import { ArrowUpRight, Cable, Cpu, Headphones, Laptop, Monitor, PanelsTopLeft, Keyboard, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../utils/money'
import type { Product } from '../types/product'
import { ImageWithFallback } from './ImageWithFallback'
import { getCatalogMode } from '../services/catalog'

const conditions = { new_sealed: 'New · sealed', new_open_box: 'New · open box', used: 'Used', refurbished: 'Refurbished' } as const
const availability = { in_stock: 'In stock', out_of_stock: 'Out of stock', check_at_store: 'Check at store' } as const

const categoryIcons = { laptops: Laptop, 'desktop-computers': PanelsTopLeft, 'pc-components': Cpu, monitors: Monitor, peripherals: Keyboard, accessories: Cable, 'custom-pc-builds': Headphones } as const

export function ProductCard({ product }: { product: Product }) {
  const Icon = categoryIcons[product.category as keyof typeof categoryIcons] ?? Package
  const demo = getCatalogMode() === 'demo'
  return <article className="product-card">
    <Link className="product-image-link" to={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
      <ImageWithFallback className="product-image" src={product.imageUrl} alt={product.imageAlt} fallbackIcon={Icon} />
      {product.isFeatured && <span className="discount-badge">Featured</span>}
    </Link>
    <div className="product-card-body"><span className="product-brand">{product.brand}</span>
      <Link className="product-title" to={`/products/${product.slug}`}>{product.name}</Link>
      <div className="product-specs">{product.specifications.slice(0, 2).map((spec) => <span key={spec}>{spec}</span>)}</div>
      <div className="product-badges"><span className={`condition-badge ${product.condition ?? 'unconfirmed'}`}>{product.condition ? conditions[product.condition] : demo ? 'Example · condition unverified' : 'Condition to be confirmed'}</span></div>
      <p className={`product-availability availability-${product.availabilityStatus ?? 'check_at_store'}`}>{product.availabilityStatus ? availability[product.availabilityStatus] : 'Check at store'}</p>
      <div className="product-card-bottom"><div className="product-price-block"><strong>{product.price == null ? 'Price to be confirmed' : formatMoney(product.price, product.currency)}</strong></div>
        <Link className="product-view-link" to={`/products/${product.slug}`} aria-label={`View details for ${product.name}`}><ArrowUpRight size={16} /></Link></div>
      <Link className="product-card-details" to={`/products/${product.slug}`}>View product details</Link>
    </div>
  </article>
}
