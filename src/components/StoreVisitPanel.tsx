import { Clock3, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { store } from '../config/store'
import { validDirectionsUrl, validPhoneHref } from '../utils/productInquiry'

export function StoreVisitPanel() {
  const directions = validDirectionsUrl(store.directionsUrl, store.address)
  const phone = validPhoneHref(store.supportPhone)
  const hasVisitInfo = Boolean(store.address.trim() || store.openingHours.trim() || store.supportPhone.trim() || store.supportEmail.trim())
  return <section className="store-visit-panel" aria-labelledby="store-visit-title">
    <div className="store-visit-heading"><span className="store-visit-icon"><MapPin size={22} /></span><div><p className="eyebrow">Visit the store</p><h2 id="store-visit-title">Find us in person</h2></div></div>
    <div className="store-visit-details">
      <div className="store-visit-item"><MapPin size={17} /><div><strong>Address</strong><span>{store.address.trim() || 'Address to be confirmed by the store'}</span></div></div>
      <div className="store-visit-item"><Clock3 size={17} /><div><strong>Opening hours</strong><span>{store.openingHours.trim() || 'Hours to be confirmed by the store'}</span></div></div>
      <div className="store-visit-item"><Phone size={17} /><div><strong>Phone</strong>{phone ? <a href={phone}>{store.supportPhone}</a> : <span>Phone number to be confirmed</span>}</div></div>
      <div className="store-visit-item"><Mail size={17} /><div><strong>Email</strong>{/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.supportEmail.trim()) ? <a href={`mailto:${store.supportEmail.trim()}`}>{store.supportEmail.trim()}</a> : <span>Email address to be confirmed</span>}</div></div>
    </div>
    <div className="store-visit-actions">{directions && <a className="button button-primary" href={directions} target="_blank" rel="noreferrer"><Navigation size={16} /> Get directions</a>}{!hasVisitInfo && <p>Store details will appear here once confirmed by KEI Computer Store.</p>}<Link className="store-contact-link" to="/contact">Contact options</Link></div>
  </section>
}
