import { useState } from 'react'
import { ArrowLeft, Check, Clock3, Cpu, Laptop, Monitor, PanelsTopLeft, ShieldQuestion, Cable, Keyboard, Headphones, Copy, MapPin, MessageCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { ProductCard } from '../components/ProductCard'
import { store } from '../config/store'
import { useCatalog } from '../state/CatalogContext'
import type { Product, ProductCategory, ProductCondition } from '../types/product'
import { brandKey } from '../utils/productCatalog'
import { formatMoney } from '../utils/money'
import { configuredInquiryLinks, createInquiryMessage } from '../utils/productInquiry'

const icons = { laptops: Laptop, 'desktop-computers': PanelsTopLeft, 'pc-components': Cpu, monitors: Monitor, peripherals: Keyboard, accessories: Cable, 'custom-pc-builds': Headphones } satisfies Record<ProductCategory, typeof Laptop>
const conditionLabels: Record<ProductCondition, string> = { new_sealed: 'New · sealed', new_open_box: 'New · open box', used: 'Second-hand · used', refurbished: 'Refurbished' }
const availabilityLabels = { in_stock: 'In stock', out_of_stock: 'Out of stock', check_at_store: 'Check availability at the store' } as const

export default function ProductDetailPage() {
  const { slug } = useParams()
  const { products, loading, error, mode } = useCatalog()
  const [selectedImage, setSelectedImage] = useState(0)
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [inquiryFeedback, setInquiryFeedback] = useState('')
  const product = products.find((item) => item.slug === slug)

  if (loading) return <main className="page-wrap catalog-state" role="status">Loading product information…</main>
  if (error) return <main className="page-wrap catalog-state catalog-error" role="alert"><h1>Product information unavailable</h1><p>{error}</p><Link className="button button-primary" to="/products">Back to catalog</Link></main>
  if (!product) return <main className="page-wrap product-not-found"><p className="eyebrow">Catalog</p><h1>We couldn’t find that product</h1><p>This product may no longer be published. Browse the catalog for currently published products.</p><Link className="button button-primary" to="/products"><ArrowLeft size={16} /> Back to the catalog</Link></main>

  const categoryName = product.category
  const Icon = icons[product.category as ProductCategory] ?? Laptop
  const activeImage = product.images[selectedImage] ?? product.images[0]
  const relatedProducts = products.filter((item) => item.id !== product.id && (item.category === product.category || brandKey(item) === brandKey(product))).slice(0, 4)
  const contactLinks = inquiryMessage ? configuredInquiryLinks(inquiryMessage, { email: store.supportEmail, telegram: store.socialLinks.telegram, whatsapp: store.socialLinks.whatsapp, facebook: store.socialLinks.facebook }) : []

  function askAboutAvailability() {
    setInquiryMessage(createInquiryMessage(product as Product, window.location.origin))
    setInquiryFeedback('')
  }
  async function copyInquiry() {
    try { await navigator.clipboard.writeText(inquiryMessage); setInquiryFeedback('Message copied. Sending it does not reserve the product.') }
    catch { setInquiryFeedback('Copy is unavailable here. Select the message below and copy it manually.') }
  }

  return <main className="page-wrap product-detail-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><Link to={`/products?category=${product.category}`}>{categoryName}</Link><span>/</span><span aria-current="page">{product.name}</span></nav>
    <Link className="catalog-back-link" to={`/products?category=${product.category}`}><ArrowLeft size={15} /> Back to {categoryName}</Link>
    <section className="detail-hero">
      <div className="detail-gallery"><div className="detail-main-image"><ImageWithFallback src={activeImage?.publicUrl ?? product.imageUrl} alt={activeImage?.altText ?? product.imageAlt} className="detail-image" fallbackIcon={Icon} loading="eager" /></div>
        {product.images.length > 1 && <div className="detail-thumbnails" aria-label="Product images">{product.images.map((image, index) => <button key={image.id} type="button" className={selectedImage === index ? 'active' : ''} aria-label={`Show image ${index + 1}: ${image.altText || product.name}`} aria-pressed={selectedImage === index} onClick={() => setSelectedImage(index)}><ImageWithFallback className="detail-thumbnail-image" src={image.publicUrl} alt={image.altText || `${product.name} image ${index + 1}`} fallbackIcon={Icon} /></button>)}</div>}
        {mode === 'demo' && <p className="image-credit">Demo product image · not confirmed store photography</p>}
      </div>
      <div className="detail-summary"><span className="product-brand">{product.brand}{product.model ? ` · ${product.model}` : ''}</span><h1>{product.name}</h1><p className="detail-sku">SKU: {product.sku}</p>
        <p className={`detail-condition condition-${product.condition ?? 'unconfirmed'}`}>{product.condition ? conditionLabels[product.condition] : mode === 'demo' ? 'Example · condition unverified' : 'Condition to be confirmed'}</p>
        <div className="detail-price"><strong>{product.price == null ? 'Price to be confirmed' : formatMoney(product.price, product.currency)}</strong></div>
        <p className={`detail-availability-note availability-${product.availabilityStatus ?? 'check_at_store'}`}><Clock3 size={15} />{product.availabilityStatus ? availabilityLabels[product.availabilityStatus] : 'Check availability at the store'}</p>
        <p className="detail-description">{product.description || 'Product description to be confirmed.'}</p>
        <div className="detail-key-specs"><h2>Key specifications</h2>{product.technicalSpecifications.length ? <ul>{product.technicalSpecifications.slice(0, 6).map((spec) => <li key={`${spec.label}:${spec.value}`}><Check size={15} /><span><strong>{spec.label}</strong>{spec.value}</span></li>)}</ul> : <p>Specifications to be confirmed.</p>}</div>
        <div className="detail-actions"><Link className="button button-primary" to="/contact"><MapPin size={16} /> View store information</Link><button type="button" className="button button-secondary" onClick={askAboutAvailability}><MessageCircle size={16} /> Ask about availability</button></div>
        {inquiryMessage && <div className="inquiry-detail"><p>Use a configured contact channel to ask about this product. This message does not reserve it.</p><div className="configured-contact-links">{contactLinks.map((contact) => <a key={contact.label} className="button button-secondary" href={contact.href} target={contact.href.startsWith('mailto:') ? undefined : '_blank'} rel={contact.href.startsWith('mailto:') ? undefined : 'noreferrer'}>{contact.label}</a>)}</div>{!contactLinks.length && <p className="unconfigured-contact">No verified contact channel is configured. Visit the store information page for confirmed details.</p>}<label htmlFor="product-inquiry-text">Message</label><textarea id="product-inquiry-text" rows={4} readOnly value={inquiryMessage} /><button type="button" className="text-button copy-inquiry" onClick={copyInquiry}><Copy size={14} /> Copy message</button><p className="interaction-feedback" role="status">{inquiryFeedback}</p></div>}
        {mode === 'demo' && <aside className="demo-listing-note"><ShieldQuestion size={18} /><p><strong>Demo listing</strong><span>Product details are examples. Confirm condition, price, specifications, and availability with the store.</span></p></aside>}
      </div>
    </section>
    <section className="specification-section" aria-labelledby="spec-heading"><div className="section-heading-row"><div><p className="eyebrow">Product information</p><h2 id="spec-heading">Specifications & included items</h2></div></div><div className="specification-table-wrap"><table className="specification-table"><tbody>
      {product.technicalSpecifications.map((item) => <tr key={item.label}><th scope="row">{item.label}</th><td>{item.value}</td></tr>)}
      <tr><th scope="row">Condition</th><td>{product.condition ? conditionLabels[product.condition] : 'To be confirmed'}</td></tr>
      <tr><th scope="row">Availability</th><td>{product.availabilityStatus ? availabilityLabels[product.availabilityStatus] : 'Check at store'}</td></tr>
      <tr><th scope="row">Warranty</th><td>{product.warrantyDetails || 'Warranty details to be confirmed.'}</td></tr>
      <tr><th scope="row">Included accessories</th><td>{product.includedAccessories.length ? product.includedAccessories.join(', ') : 'Not specified'}</td></tr>
      {product.conditionNotes && <tr><th scope="row">Condition notes</th><td>{product.conditionNotes}</td></tr>}
      {product.knownDefects && <tr><th scope="row">Known defects</th><td>{product.knownDefects}</td></tr>}
    </tbody></table></div></section>
    {relatedProducts.length > 0 && <section className="related-products"><div className="section-heading-row"><div><p className="eyebrow">Keep exploring</p><h2>Related products</h2></div><Link className="section-link" to={`/products?category=${product.category}`}>View category</Link></div><div className="product-grid">{relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
  </main>
}
