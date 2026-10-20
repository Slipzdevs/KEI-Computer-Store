import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeInfo,
  BookOpenCheck,
  Headset,
  MessageCircleMore,
  ShieldQuestion,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AudienceCard } from '../components/AudienceCard'
import { CategoryCard } from '../components/CategoryCard'
import { FeaturedProducts } from '../components/FeaturedProducts'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { StoreVisitPanel } from '../components/StoreVisitPanel'
import { store } from '../config/store'
import { audienceCards, categories as homeCategories } from '../data/homepage'
import { useCatalog } from '../state/CatalogContext'

const heroImage = 'https://images.unsplash.com/photo-1661006670127-b560e732ce28?auto=format&fit=crop&w=1600&q=88'

export default function HomePage() {
  const { mode } = useCatalog()
  return (
    <main>
      <section className="hero-section page-wrap" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <span className="hero-kicker"><span className="hero-kicker-dot" /> {store.name}{mode === 'demo' && <small> · DEMO</small>}</span>
          <h1 id="hero-heading">Power your<br /><span>next upgrade.</span></h1>
          <p>Find computers, components, and accessories for the way you work, create, and play.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/products">Browse products <ArrowRight size={16} /></Link>
            <Link className="button button-secondary" to="/products?category=custom-pc-builds">Explore PC Builds <ArrowUpRight size={16} /></Link>
          </div>
          <div className="hero-footnote"><ArrowDownRight size={15} /><span>Explore the catalog, then contact the store to confirm details.</span></div>
        </div>
        <div className="hero-visual">
          <ImageWithFallback className="hero-image" src={heroImage} alt="Laptop open on a bright desk" fallbackIcon={BookOpenCheck} loading="eager" />
          <div className="hero-image-wash" aria-hidden="true" />
          <div className="hero-image-caption"><span className="hero-caption-icon"><BookOpenCheck size={18} /></span><span><strong>Technology for every day</strong><small>Explore a setup that fits your needs</small></span></div>
          <span className="hero-image-index" aria-hidden="true">01 / 03</span>
        </div>
      </section>

      <section className="service-strip" aria-label="Store information">
        <div className="page-wrap service-strip-inner">
          <div className="service-item"><span className="service-icon"><BadgeInfo size={19} /></span><span><strong>Product details</strong><small>Browse specifications and features</small></span></div>
          <div className="service-item"><span className="service-icon"><MessageCircleMore size={19} /></span><span><strong>Ask the store</strong><small>Confirm product availability</small></span></div>
          <div className="service-item"><span className="service-icon"><ShieldQuestion size={19} /></span><span><strong>Visit in person</strong><small>Check location and hours</small></span></div>
        </div>
      </section>

      <div className="page-wrap home-content">
        <section className="home-section category-section" aria-labelledby="category-heading">
          <div className="section-heading-row">
            <div><p className="eyebrow">Find your starting point</p><h2 id="category-heading">Browse by category</h2><p className="section-description">Explore the parts and devices that make a setup yours.</p></div>
            <Link className="section-link" to="/products">View all categories <ArrowRight size={16} /></Link>
          </div>
          <div className="category-grid">{homeCategories.map((category) => <CategoryCard key={category.slug} category={category} />)}</div>
        </section>

        <FeaturedProducts />

        <section className="home-section audience-section" aria-labelledby="audience-heading">
          <div className="section-heading-row">
            <div><p className="eyebrow">Start with what matters to you</p><h2 id="audience-heading">Find your kind of setup</h2><p className="section-description">A few useful ways to narrow your search.</p></div>
          </div>
          <div className="audience-grid">{audienceCards.map((card) => <AudienceCard key={card.audience} card={card} />)}</div>
        </section>

        <section className="build-promotion" aria-labelledby="build-heading">
          <div className="build-promotion-copy">
            <span className="eyebrow">A setup of your own</span>
            <h2 id="build-heading">Make room for<br />your next big idea.</h2>
            <p>Explore example custom PC builds and component pairings. Confirm component compatibility with the store before selecting parts.</p>
            <Link className="button button-light" to="/products?category=custom-pc-builds">Explore custom builds <ArrowRight size={16} /></Link>
          </div>
          <div className="build-promotion-image-wrap">
            <ImageWithFallback className="build-promotion-image" src="https://images.unsplash.com/photo-1783783197323-31f5291db6f7?auto=format&fit=crop&w=1200&q=88" alt="Custom desktop computer in a gaming setup" fallbackIcon={Headset} />
            <span className="build-promotion-caption"><span>BUILD NOTES</span> Choose parts around your needs</span>
          </div>
        </section>

        <StoreVisitPanel />
      </div>
    </main>
  )
}
