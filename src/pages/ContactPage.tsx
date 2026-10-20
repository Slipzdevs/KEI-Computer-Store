import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { StoreVisitPanel } from '../components/StoreVisitPanel'
import { store } from '../config/store'
import { configuredInquiryLinks } from '../utils/productInquiry'

const contactMessage = `Hello, I would like to ask a question about ${store.name}. Please let me know the confirmed store details.`

export default function ContactPage() {
  const channels = configuredInquiryLinks(contactMessage, { email: store.supportEmail, telegram: store.socialLinks.telegram, whatsapp: store.socialLinks.whatsapp, facebook: store.socialLinks.facebook })
  return <main className="page-wrap contact-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span aria-current="page">Visit & contact</span></nav>
    <header className="contact-page-heading"><p className="eyebrow">A physical computer store</p><h1>Visit or contact KEI Computer Store</h1><p>Browse example products online, then confirm current product details with the store before making a visit.</p></header>
    <StoreVisitPanel />
    <section className="contact-channels"><div><p className="eyebrow">Get in touch</p><h2>Contact the store</h2><p>Use a contact option below when it has been configured by the store.</p></div>{channels.length ? <div className="configured-contact-links">{channels.map((channel) => <a className="button button-secondary" key={channel.label} href={channel.href} target={channel.href.startsWith('mailto:') ? undefined : '_blank'} rel={channel.href.startsWith('mailto:') ? undefined : 'noreferrer'}>{channel.label}</a>)}</div> : <p className="unconfigured-contact">Contact channels have not been confirmed yet. Please check this page again after the store provides its details.</p>}</section>
    <div className="contact-catalog-link"><span>Looking for a particular computer or component?</span><Link className="button button-primary" to="/products">Browse the catalog <ArrowRight size={16} /></Link></div>
  </main>
}
