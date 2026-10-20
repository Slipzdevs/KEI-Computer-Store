import { ArrowRight, Construction } from 'lucide-react'
import { Link, Route, Routes } from 'react-router-dom'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'

function ComingSoon({ title }: { title: string }) {
  return (
    <main className="page-wrap placeholder-page">
      <span className="placeholder-icon"><Construction size={21} /></span>
      <p className="eyebrow">The foundation is ready</p>
      <h1>{title}</h1>
      <p>This page is part of the upcoming TechStore demo. The shared storefront shell and navigation are in place.</p>
      <Link className="button button-primary" to="/">Back to home <ArrowRight size={16} /></Link>
    </main>
  )
}

function NotFound() {
  return <ComingSoon title="Page not found" />
}

export default function App() {
  return (
    <div className="app-shell">
      <SiteHeader />
      <Routes>
        <Route path="/" element={<main className="page-wrap welcome-page"><p className="eyebrow">Welcome to {`TechStore`}</p><h1>Technology, thoughtfully chosen.</h1><p>Your next great setup starts here. The storefront is taking shape.</p><Link className="button button-primary" to="/products">Explore the store <ArrowRight size={16} /></Link></main>} />
        <Route path="/products" element={<ComingSoon title="Find your next upgrade" />} />
        <Route path="/products/:slug" element={<ComingSoon title="Product details" />} />
        <Route path="/compare" element={<ComingSoon title="Compare your shortlist" />} />
        <Route path="/cart" element={<ComingSoon title="Your shopping bag" />} />
        <Route path="/account" element={<ComingSoon title="Your account" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SiteFooter />
    </div>
  )
}
