import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../state/CatalogContext'
import { ProductCard } from './ProductCard'

export function FeaturedProducts() {
  const { products, loading, error, mode } = useCatalog()
  const [selected, setSelected] = useState('featured')
  const visibleProducts = (selected === 'featured' ? products.filter((product) => product.isFeatured) : products.filter((product) => product.category === selected)).slice(0, 4)

  return (
    <section className="home-section featured-section" aria-labelledby="featured-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">A few ideas to get started</p>
          <h2 id="featured-heading">Featured products</h2>
          <p className="section-description">Explore example products and compare their specifications.</p>
        </div>
        <Link className="section-link" to="/products">Browse all products <ArrowRight size={16} /></Link>
      </div>
      <div className="product-tabs" role="tablist" aria-label="Featured product categories">
        {[{ id: 'featured', label: 'Featured' }, { id: 'laptops', label: 'Laptops' }, { id: 'pc-components', label: 'Components' }].map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected === tab.id}
            aria-controls="featured-product-panel"
            onClick={() => setSelected(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {loading && <p className="catalog-state" role="status">Loading products…</p>}
      {!loading && error && <p className="catalog-state" role="alert">{error}</p>}
      {!loading && !error && !visibleProducts.length && <p className="catalog-state">No products are available in this section yet.</p>}
      {!loading && !error && visibleProducts.length > 0 && <div id="featured-product-panel" className="product-grid" role="tabpanel" aria-labelledby={`tab-${selected}`}>
        {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>}
      {mode === 'demo' && <p className="demo-note">Demo products are examples and are not verified store inventory.</p>}
    </section>
  )
}
