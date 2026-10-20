import { lazy, Suspense } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, Outlet, Route, Routes } from 'react-router-dom'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { store } from './config/store'
import { AdminAuthProvider } from './state/AdminAuthContext'
import { CatalogProvider } from './state/CatalogContext'

const HomePage = lazy(() => import('./pages/HomePage'))
const InfoPage = lazy(() => import('./pages/InfoPage').then(({ InfoPage: page }) => ({ default: page })))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AdminRoutes = lazy(() => import('./pages/admin/AdminApp').then(({ AdminRoutes: routes }) => ({ default: routes })))

function NotFound() {
  return <main className="page-wrap placeholder-page"><p className="eyebrow">{store.name}</p><h1>Page not found</h1><p>Choose a category or return to the homepage to continue exploring the product catalog.</p><Link className="button button-primary" to="/">Back to home <ArrowRight size={16} /></Link></main>
}

function StorefrontLayout() {
  return <div className="app-shell"><SiteHeader /><Outlet /><SiteFooter /></div>
}

export default function App() {
  return <AdminAuthProvider><CatalogProvider><Suspense fallback={<main className="page-wrap catalog-state" role="status">Loading page…</main>}><Routes>
    <Route path="/admin/*" element={<Suspense fallback={<main className="admin-state" role="status">Loading management tools…</main>}><AdminRoutes /></Suspense>} />
    <Route element={<StorefrontLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:slug" element={<ProductDetailPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/shipping" element={<InfoPage title="Shipping information" description={store.policies.shipping || 'Shipping and delivery information has not yet been confirmed by the store.'} isConfigured={Boolean(store.policies.shipping.trim())} />} />
      <Route path="/returns" element={<InfoPage title="Returns and warranty" description={store.policies.returns || store.policies.warranty || 'Returns and warranty information has not yet been confirmed by the store.'} isConfigured={Boolean(store.policies.returns.trim() || store.policies.warranty.trim())} />} />
      <Route path="/faq" element={<InfoPage title="Help and FAQs" description={store.policies.faq || 'Store support information has not yet been confirmed.'} isConfigured={Boolean(store.policies.faq.trim())} />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes></Suspense></CatalogProvider></AdminAuthProvider>
}
