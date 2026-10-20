import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MapPin, Menu, Search, X } from 'lucide-react'
import { store } from '../config/store'
import { categories } from '../data/homepage'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const selectedCategory = searchParams.get('category')
  const validCategory = categories.some((category) => category.slug === selectedCategory)
  const shopAllActive = location.pathname === '/products' && !validCategory && !searchParams.has('sort')
  const dealsActive = location.pathname === '/products' && searchParams.get('sort') === 'deals'

  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get('search') ?? '')
  }, [location.pathname, location.search])

  function catalogLink(update: (params: URLSearchParams) => void) {
    const params = location.pathname === '/products' ? new URLSearchParams(location.search) : new URLSearchParams()
    update(params)
    return params.size ? `/products?${params.toString()}` : '/products'
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const search = query.trim()
    navigate(catalogLink((params) => search ? params.set('search', search) : params.delete('search')))
    setMenuOpen(false)
  }

  return (
    <>
      <div className="announcement">{store.announcement}</div>
      <header className="site-header">
        <div className="header-main page-wrap">
          <button
            className="icon-button mobile-menu-toggle"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link className="brand" to="/" aria-label={`${store.name} home`}>
            <span className="brand-mark" aria-hidden="true">{store.monogram}</span>
            <span>{store.name}<small>TECHNOLOGY, THOUGHTFULLY CHOSEN</small></span>
          </Link>
          <form className="header-search" role="search" onSubmit={submitSearch}>
            <Search size={17} aria-hidden="true" />
            <label className="sr-only" htmlFor="site-search">Search products</label>
            <input id="site-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
            <button type="submit">Search</button>
          </form>
          <div className="header-actions"><Link className="header-action" to="/contact" aria-label="Visit and contact information"><MapPin size={18} /><span>Visit & contact</span></Link></div>
        </div>
        <nav className={`category-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Product categories">
          <div className="page-wrap category-nav-inner">
            <Link className={shopAllActive ? 'active' : undefined} aria-current={shopAllActive ? 'page' : undefined} to="/products" onClick={() => setMenuOpen(false)}>Catalog</Link>
            {categories.map((category) => (
              <Link key={category.slug} className={selectedCategory === category.slug ? 'active' : undefined} aria-current={selectedCategory === category.slug ? 'page' : undefined} to={catalogLink((params) => params.set('category', category.slug))} onClick={() => setMenuOpen(false)}>{category.title}</Link>
            ))}
            <Link className={`deals-link ${dealsActive ? 'active' : ''}`} aria-current={dealsActive ? 'page' : undefined} to={catalogLink((params) => params.set('sort', 'deals'))} onClick={() => setMenuOpen(false)}>Deals</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)}>Visit & contact</Link>
          </div>
        </nav>
      </header>
    </>
  )
}
