import { ArrowUpRight, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { store } from '../config/store'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-wrap footer-main">
        <div className="footer-brand-column">
          <Link className="brand footer-brand" to="/">
            <span className="brand-mark" aria-hidden="true">T</span><span>{store.name}<small>TECHNOLOGY, THOUGHTFULLY CHOSEN</small></span>
          </Link>
          <p>Good technology should make every day work a little better. Find your next favorite setup with a team that knows the details.</p>
          <a className="footer-contact" href={`mailto:${store.supportEmail}`}><Mail size={16} />{store.supportEmail}</a>
          <a className="footer-contact" href={`tel:${store.supportPhone.replace(/[^+\d]/g, '')}`}><Phone size={16} />{store.supportPhone}</a>
        </div>
        <div className="footer-links-column"><h2>Explore</h2><Link to="/products">All products</Link><Link to="/products?category=laptops">Laptops</Link><Link to="/products?category=components">Components</Link><Link to="/compare">Compare products</Link></div>
        <div className="footer-links-column"><h2>Here to help</h2><a href={`mailto:${store.supportEmail}`}>Contact us</a><Link to="/shipping">Shipping information</Link><Link to="/returns">Returns & warranty</Link><Link to="/faq">FAQs</Link></div>
        <div className="footer-note">
          <span className="eyebrow">A little more human</span>
          <h2>Big decisions.<br />Helpful people.</h2>
          <p>Questions about a build or product? Our team can help you find the right fit.</p>
          <a className="text-link" href={`mailto:${store.supportEmail}`}>Talk to our team <ArrowUpRight size={16} /></a>
          <div className="store-placeholder"><MapPin size={15} />{store.address}</div>
        </div>
      </div>
      <div className="footer-bottom page-wrap"><span>© {new Date().getFullYear()} {store.name}. Demo storefront.</span><span>Business details are placeholders until configured.</span><a href={`mailto:${store.supportEmail}`} aria-label="Email TechStore"><Send size={15} /></a></div>
    </footer>
  )
}
