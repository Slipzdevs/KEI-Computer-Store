import { ArrowUpRight, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { store } from '../config/store'
import { validPhoneHref } from '../utils/productInquiry'

export function SiteFooter() {
  const phoneHref = validPhoneHref(store.supportPhone)
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.supportEmail.trim()) ? store.supportEmail.trim() : ''
  return (
    <footer className="site-footer">
      <div className="page-wrap footer-main">
        <div className="footer-brand-column">
          <Link className="brand footer-brand" to="/">
            <span className="brand-mark" aria-hidden="true">{store.monogram}</span><span>{store.name}<small>TECHNOLOGY, THOUGHTFULLY CHOSEN</small></span>
          </Link>
          <p>Explore products and their specifications, then contact or visit the store to confirm details.</p>
          {email && <a className="footer-contact" href={`mailto:${email}`}><Mail size={16} />{email}</a>}
          {phoneHref && <a className="footer-contact" href={phoneHref}><Phone size={16} />{store.supportPhone}</a>}
          {!email && !phoneHref && <span className="footer-contact"><Mail size={16} />Contact details to be confirmed</span>}
        </div>
        <div className="footer-links-column"><h2>Explore</h2><Link to="/products">All products</Link><Link to="/products?category=laptops">Laptops</Link><Link to="/products?category=pc-components">Components</Link></div>
        <div className="footer-links-column"><h2>Visit & information</h2><Link to="/contact">Store location and contact</Link><Link to="/shipping">Shipping information</Link><Link to="/returns">Returns & warranty</Link><Link to="/faq">FAQs</Link></div>
        <div className="footer-note">
          <span className="eyebrow">A little more human</span>
          <h2>Explore online.<br />Visit in person.</h2>
          <p>Store hours, location, and contact channels are shown when confirmed.</p>
          <Link className="text-link" to="/contact">Store information <ArrowUpRight size={16} /></Link>
          {store.address && <div className="store-placeholder"><MapPin size={15} />{store.address}</div>}
        </div>
      </div>
      <div className="footer-bottom page-wrap"><span>© {new Date().getFullYear()} {store.name}. Product showcase.</span><span>Product information and prices are for demonstration.</span>{email && <a href={`mailto:${email}`} aria-label={`Email ${store.name}`}><Send size={15} /></a>}</div>
    </footer>
  )
}
