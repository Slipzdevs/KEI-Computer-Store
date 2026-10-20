import { ArrowRight, BadgeCheck, CircleHelp, ClipboardCheck, MapPin, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { store } from '../config/store'

export type InfoPageSection = 'shipping' | 'returns' | 'faq'

const faqItems = [
  {
    question: 'How can I purchase a product?',
    answer: 'Browse the catalog, then contact KEI Computer Store or visit the shop to confirm the current price, condition, availability, and purchase arrangements. A product page is an enquiry starting point, not a reservation.',
  },
  {
    question: 'Can I buy directly through this website?',
    answer: 'No. This website is a product showcase. It has no cart, online checkout, online payment, or order submission. Contact the store or visit in person to complete a purchase.',
  },
  {
    question: 'How can I check whether a product is available?',
    answer: 'Open the product listing and review its availability label, then use “Ask about availability” or the contact options to confirm with the store. Online information may not reflect a recent in-store sale.',
  },
  {
    question: 'How can I confirm a product’s specifications?',
    answer: 'Review the specifications and condition notes on that product’s page. If a detail is missing or important to your decision, ask the store to confirm it before purchasing; blank details should not be treated as a specification.',
  },
  {
    question: 'What do new, open-box, used, and refurbished mean?',
    answer: 'These labels describe different product conditions, but the exact meaning and history can vary by item. Read the listing’s condition notes and known defects, then ask the store about packaging, prior use, refurbishment work, and included accessories.',
  },
  {
    question: 'How do I ask about delivery?',
    answer: 'Contact the store with the product name or link and your location. Confirm whether delivery is available, its fee, coverage, and estimated timing before arranging a purchase. This site does not calculate delivery or accept an order.',
  },
  {
    question: 'What should I know about returns and warranty?',
    answer: 'Return eligibility and warranty terms depend on the specific product and terms confirmed by the store or manufacturer. Ask about coverage, duration, exclusions, and claim steps before purchasing. Contact the store before bringing or sending an item back.',
  },
  {
    question: 'How can I contact or visit the store?',
    answer: 'Open the Visit & contact page for the contact channels, address, hours, and directions that KEI Computer Store has configured. Details that have not been confirmed are clearly marked; no contact details or location are assumed here.',
  },
]

function InfoContactCard({ title, children }: { title: string; children: string }) {
  return (
    <aside className="info-contact-card">
      <span className="info-contact-icon" aria-hidden="true"><MapPin size={19} /></span>
      <div className="info-contact-copy">
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
      <Link className="button button-primary" to="/contact">View contact options <ArrowRight size={16} /></Link>
    </aside>
  )
}

function ConfiguredPolicy({ label, value }: { label: string; value: string }) {
  const text = value.trim()
  if (!text) return null
  return <div className="info-policy-card"><h3>{label}</h3><p>{text}</p></div>
}

export function InfoPage({ section }: { section: InfoPageSection }) {
  if (section === 'shipping') {
    return (
      <main className="page-wrap info-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span aria-current="page">Shipping information</span></nav>
        <header className="info-page-heading">
          <p className="eyebrow">Plan with the store</p>
          <h1>Shipping information</h1>
          <p>Ask KEI Computer Store about delivery for the specific product and destination you have in mind. Delivery details are confirmed directly with the store.</p>
        </header>

        <section className="info-feature info-feature--shipping" aria-labelledby="shipping-feature-title">
          <span className="info-feature-icon" aria-hidden="true"><Truck size={28} /></span>
          <div><p className="eyebrow">Product showcase · in-store purchase</p><h2 id="shipping-feature-title">Check delivery before making plans</h2><p>This website helps you explore products. It does not arrange delivery, accept an order, or take payment. Contact the store or visit in person to confirm a purchase.</p></div>
          <span className="info-feature-tag"><BadgeCheck size={16} /> Confirmed with the store</span>
        </section>

        {store.policies.shipping.trim() && <ConfiguredPolicy label="Store-provided shipping information" value={store.policies.shipping} />}

        <section className="info-section" aria-labelledby="delivery-details-title">
          <div className="info-section-heading"><p className="eyebrow">Before arranging delivery</p><h2 id="delivery-details-title">Confirm the details for your product</h2><p>Coverage, fees, and timing can depend on the item and destination. Ask the store to confirm each detail before you agree to a purchase.</p></div>
          <div className="info-card-grid">
            <article className="info-detail-card"><span className="info-card-number">01</span><h3>Availability</h3><p>Check whether delivery is available for the product and your location. A listing does not confirm a delivery option.</p></article>
            <article className="info-detail-card"><span className="info-card-number">02</span><h3>Coverage and fee</h3><p>Ask whether your area is covered and what delivery fee, if any, applies. No rate or coverage promise is published here.</p></article>
            <article className="info-detail-card"><span className="info-card-number">03</span><h3>Estimated timing</h3><p>Request an estimate from the store before making plans. This site does not publish a delivery timeframe.</p></article>
          </div>
        </section>

        <section className="info-steps" aria-labelledby="delivery-check-title">
          <div><p className="eyebrow">A quick way to ask</p><h2 id="delivery-check-title">What to include in your message</h2><p>Sharing a little context helps the store check the right product and destination.</p></div>
          <ol><li><span>1</span><div><strong>Name the product</strong><p>Include its listing name, product link, or SKU.</p></div></li><li><span>2</span><div><strong>Share your destination</strong><p>Provide your town or area so the store can check delivery availability.</p></div></li><li><span>3</span><div><strong>Confirm before proceeding</strong><p>Ask about the fee and estimated timing before agreeing to a purchase.</p></div></li></ol>
        </section>

        <InfoContactCard title="Need delivery details for an item?">Open the contact page to see the store’s currently configured contact and visit information.</InfoContactCard>
      </main>
    )
  }

  if (section === 'returns') {
    return (
      <main className="page-wrap info-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span aria-current="page">Returns & warranty</span></nav>
        <header className="info-page-heading">
          <p className="eyebrow">Know the product and its terms</p>
          <h1>Returns &amp; warranty</h1>
          <p>Product condition, return eligibility, and warranty coverage can differ from one item to another. Confirm the applicable terms with KEI Computer Store before purchasing.</p>
        </header>

        <section className="info-feature info-feature--returns" aria-labelledby="returns-feature-title">
          <span className="info-feature-icon" aria-hidden="true"><ShieldCheck size={28} /></span>
          <div><p className="eyebrow">Product-specific information</p><h2 id="returns-feature-title">Check the details before you decide</h2><p>Review the listing’s condition, specifications, included accessories, and any known defects. Ask the store to clarify anything that is missing or unclear.</p></div>
          <span className="info-feature-tag"><ClipboardCheck size={16} /> Confirm terms first</span>
        </section>

        {(store.policies.returns.trim() || store.policies.warranty.trim()) ? <div className="info-policy-grid"><ConfiguredPolicy label="Return information supplied by the store" value={store.policies.returns} /><ConfiguredPolicy label="Warranty information supplied by the store" value={store.policies.warranty} /></div> : <div className="info-policy-notice"><ShieldCheck size={19} /><p><strong>Official return and warranty terms have not been configured.</strong> No return period, refund or exchange promise, warranty duration, or repair coverage is stated on this site. Confirm the terms for your specific product directly with the store before purchasing.</p></div>}

        <section className="info-section" aria-labelledby="issue-preparation-title">
          <div className="info-section-heading"><p className="eyebrow">If you have a product concern</p><h2 id="issue-preparation-title">Have these details ready</h2><p>Providing clear information helps the store understand your question and check the product’s applicable terms.</p></div>
          <div className="info-card-grid info-card-grid--three">
            <article className="info-detail-card"><span className="info-card-symbol"><ClipboardCheck size={19} /></span><h3>Proof of purchase</h3><p>Keep the receipt or other purchase record available when asking the store to review your case.</p></article>
            <article className="info-detail-card"><span className="info-card-symbol"><BadgeCheck size={19} /></span><h3>Product details</h3><p>Share the product name, model or SKU, and any information that identifies the item.</p></article>
            <article className="info-detail-card"><span className="info-card-symbol"><CircleHelp size={19} /></span><h3>Description of the issue</h3><p>Explain what happened, when you noticed it, and any steps already taken.</p></article>
          </div>
        </section>

        <section className="info-warranty-note" aria-labelledby="warranty-types-title"><div><p className="eyebrow">Two different sources of coverage</p><h2 id="warranty-types-title">Ask who provides the warranty</h2></div><div className="info-warranty-columns"><article><h3>Manufacturer warranty</h3><p>Coverage may be offered by the product manufacturer. Confirm whether it applies to this item, how long it lasts, what it excludes, and how to make a claim.</p></article><article><h3>Store warranty</h3><p>A store warranty applies only when KEI Computer Store explicitly offers one for the product. Confirm its duration, coverage, exclusions, and claim steps with the store.</p></article></div></section>

        <InfoContactCard title="Contact the store before returning an item">Ask the store to confirm eligibility and instructions before bringing or sending a product back. This page does not promise a return or refund.</InfoContactCard>
      </main>
    )
  }

  return (
    <main className="page-wrap info-page info-page--faq">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span aria-current="page">FAQs</span></nav>
      <header className="info-page-heading">
        <p className="eyebrow">Helpful answers</p>
        <h1>Frequently asked questions</h1>
        <p>How to browse the showcase, check product details, and get in touch with KEI Computer Store.</p>
      </header>
      {store.policies.faq.trim() && <ConfiguredPolicy label="Additional information supplied by the store" value={store.policies.faq} />}
      <section className="faq-layout" aria-labelledby="faq-list-heading">
        <div className="faq-intro"><span className="info-feature-icon" aria-hidden="true"><CircleHelp size={26} /></span><p className="eyebrow">Quick answers</p><h2 id="faq-list-heading">About the product showcase</h2><p>This site helps you research listings. Purchase, delivery, and policy details are confirmed directly with the store.</p><Link className="text-link" to="/products">Browse the catalog <ArrowRight size={16} /></Link></div>
        <div className="faq-list">{faqItems.map((item, index) => <details className="faq-item" key={item.question}><summary><span className="faq-index">{String(index + 1).padStart(2, '0')}</span><span className="faq-question">{item.question}</span><span className="faq-indicator" aria-hidden="true" /></summary><div className="faq-answer"><p>{item.answer}</p>{index === 7 && <Link to="/contact">Visit &amp; contact information <ArrowRight size={14} /></Link>}</div></details>)}</div>
      </section>
      <InfoContactCard title="Still have a question?">Visit the contact page to see the contact options and store details that have been confirmed.</InfoContactCard>
    </main>
  )
}
