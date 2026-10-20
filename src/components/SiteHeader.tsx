import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { store } from '../config/store'

const categories = ['Laptops', 'Desktops', 'Components', 'Monitors', 'Peripherals', 'Accessories']

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const search = query.trim()
    navigate(search ? `/products?search=${encodeURIComponent(search)}` : '/products')
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
            <span className="brand-mark" aria-hidden="true">T</span>
            <span>{store.name}<small>TECHNOLOGY, THOUGHTFULLY CHOSEN</small></span>
          </Link>
          <form className="header-search" role="search" onSubmit={submitSearch}>
            <Search size={17} aria-hidden="true" />
            <label className="sr-only" htmlFor="site-search">Search products</label>
            <input id="site-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
            <button type="submit">Search</button>
          </form>
          <div className="header-actions">
            <Link className="header-action" to="/account" aria-label="Account">
              <UserRound size={19} /><span>Account</span>
            </Link>
            <Link className="header-action cart-action" to="/cart" aria-label="Shopping bag, 0 items">
              <ShoppingBag size={19} /><span>Cart</span><b>0</b>
            </Link>
          </div>
        </div>
        <nav className={`category-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Product categories">
          <div className="page-wrap category-nav-inner">
            <NavLink end to="/products" onClick={() => setMenuOpen(false)}>Shop all</NavLink>
            {categories.map((category) => (
              <NavLink key={category} to={`/products?category=${encodeURIComponent(category.toLowerCase())}`} onClick={() => setMenuOpen(false)}>{category}</NavLink>
            ))}
            <NavLink className="deals-link" to="/products?sort=deals" onClick={() => setMenuOpen(false)}>Deals</NavLink>
          </div>
        </nav>
      </header>
    </>
  )
}
