import { useMemo } from 'react'
import { ArrowRight, ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { store } from '../config/store'
import { useCatalog } from '../state/CatalogContext'
import type { ProductCategory } from '../types/product'
import { brandKey, filterAndSortProducts } from '../utils/productCatalog'

const refinementKeys = ['brand', 'min', 'max', 'availability', 'cpu', 'gpu', 'ram', 'storage']

export default function ProductsPage() {
  const { products: activeProducts, categories, loading, error, mode, refresh } = useCatalog()
  const money = new Intl.NumberFormat(store.locale, { style: 'currency', currency: store.currency, maximumFractionDigits: 0 })
  const [params, setParams] = useSearchParams()
  const categoryParam = params.get('category') as ProductCategory | null
  const category = categories.find((item) => item.slug === categoryParam)
  const shownProducts = useMemo(() => filterAndSortProducts(activeProducts, params, categories.map(c => c.slug)), [activeProducts, params, categories])
  const brands = [...new Map(activeProducts.map((product) => [brandKey(product), product.brand])).entries()].sort((a, b) => a[1].localeCompare(b[1]))
  const laptopProducts = activeProducts.filter((product) => product.category === 'laptops')
  const cpus = [...new Set(laptopProducts.map((product) => product.cpu).filter((value): value is string => Boolean(value)))].sort()
  const gpus = [...new Set(laptopProducts.map((product) => product.gpu).filter((value): value is string => Boolean(value)))].sort()
  const hasRefinements = refinementKeys.some((key) => params.has(key))
  const currentSort = ['price-asc', 'price-desc', 'newest', 'popularity', 'deals'].includes(params.get('sort') ?? '') ? params.get('sort')! : 'popularity'

  function setParam(key: string, value: string, replace = false) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next, { replace })
  }

  function clearRefinements() {
    const next = new URLSearchParams(params)
    refinementKeys.forEach((key) => next.delete(key))
    next.delete('page')
    setParams(next)
  }

  const title = category?.name ?? (params.get('search') ? 'Search results' : currentSort === 'deals' ? 'Sample offers' : 'All products')
  const activeFilters = refinementKeys.filter((key) => params.has(key))

  return (
    <main className="page-wrap catalog-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>Products</span>{category && <><span>/</span><span aria-current="page">{category.name}</span></>}</nav>
      <header className="catalog-heading">
        <div><p className="eyebrow">{mode === 'demo' ? 'Demo catalog · local to this browser' : 'KEI Computer Store catalog'}</p><h1>{title}</h1><p>Review product details and confirm availability with the store.</p></div>
        <label className="catalog-sort">Sort by
          <span className="select-wrap"><select aria-label="Sort products" value={currentSort} onChange={(event) => setParam('sort', event.target.value)}>
            <option value="popularity">Popularity</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="newest">Newest</option><option value="deals">Sample offers</option>
          </select><ChevronDown size={15} aria-hidden="true" /></span>
        </label>
      </header>
      <form className="catalog-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="catalog-search">Search this catalog</label>
        <input id="catalog-search" type="search" placeholder="Product, brand, SKU, or specification" value={params.get('search') ?? ''} onChange={(event) => setParam('search', event.target.value, true)} />
        {params.has('search') && <button type="button" className="text-button" onClick={() => setParam('search', '')}>Clear search</button>}
      </form>
      <div className="catalog-layout">
        <aside className="filter-panel" aria-label="Product filters">
          <div className="filter-heading"><h2><SlidersHorizontal size={17} /> Filters</h2>{hasRefinements && <button className="text-button" type="button" onClick={clearRefinements}>Clear filters</button>}</div>
          <label className="filter-label" htmlFor="filter-category">Category</label>
          <select id="filter-category" value={category?.slug ?? ''} onChange={(event) => setParam('category', event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
          <label className="filter-label" htmlFor="filter-brand">Brand</label>
          <select id="filter-brand" value={params.get('brand') ?? ''} onChange={(event) => setParam('brand', event.target.value)}><option value="">All brands</option>{brands.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
          <fieldset className="filter-group"><legend>Price range</legend><div className="price-fields"><label>Min<input type="number" min="0" inputMode="decimal" placeholder="0" value={params.get('min') ?? ''} onChange={(event) => setParam('min', event.target.value, true)} /></label><label>Max<input type="number" min="0" inputMode="decimal" placeholder="No limit" value={params.get('max') ?? ''} onChange={(event) => setParam('max', event.target.value, true)} /></label></div><small>{money.format(0)} – {money.format(Math.max(0, ...activeProducts.map(({ price }) => price ?? 0)))}</small></fieldset>
          <label className="filter-label" htmlFor="filter-availability">Demo listing status</label>
          <select id="filter-availability" value={params.get('availability') ?? ''} onChange={(event) => setParam('availability', event.target.value)}><option value="">Any availability</option><option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option><option value="check_at_store">Check at store</option></select>
          {(category?.slug === 'laptops' || !category) && <div className="laptop-filters"><h3>Laptop specifications</h3>
            <label className="filter-label" htmlFor="filter-cpu">Processor</label><select id="filter-cpu" value={params.get('cpu') ?? ''} onChange={(event) => setParam('cpu', event.target.value)}><option value="">Any processor</option>{cpus.map((cpu) => <option key={cpu} value={cpu}>{cpu}</option>)}</select>
            <label className="filter-label" htmlFor="filter-gpu">Graphics</label><select id="filter-gpu" value={params.get('gpu') ?? ''} onChange={(event) => setParam('gpu', event.target.value)}><option value="">Any graphics</option>{gpus.map((gpu) => <option key={gpu} value={gpu}>{gpu}</option>)}</select>
            <label className="filter-label" htmlFor="filter-ram">Minimum RAM</label><select id="filter-ram" value={params.get('ram') ?? ''} onChange={(event) => setParam('ram', event.target.value)}><option value="">Any memory</option><option value="8">8 GB or more</option><option value="16">16 GB or more</option><option value="32">32 GB or more</option></select>
            <label className="filter-label" htmlFor="filter-storage">Minimum storage</label><select id="filter-storage" value={params.get('storage') ?? ''} onChange={(event) => setParam('storage', event.target.value)}><option value="">Any storage</option><option value="256">256 GB or more</option><option value="512">512 GB or more</option><option value="1024">1 TB or more</option></select>
          </div>}
        </aside>
        <section className="catalog-results" aria-labelledby="results-heading">
          <div className="results-toolbar"><div><h2 id="results-heading">{shownProducts.length} {shownProducts.length === 1 ? 'product' : 'products'}</h2><span>{mode === 'demo' ? 'Example product data' : 'Published products'}</span></div>{activeFilters.length > 0 && <button className="text-button" type="button" onClick={clearRefinements}>Clear {activeFilters.length} {activeFilters.length === 1 ? 'filter' : 'filters'}</button>}</div>
          {loading && <p className="catalog-state" role="status">Loading catalog…</p>}
          {!loading && error && <section className="catalog-state catalog-error" role="alert"><h2>Catalog unavailable</h2><p>{error}</p><button type="button" className="button button-primary" onClick={() => void refresh()}>Try again</button></section>}
          {!loading && !error && !shownProducts.length && !activeProducts.length && <section className="catalog-state"><h2>No published products yet</h2><p>Products will appear here after the store publishes catalog information.</p></section>}
          {activeFilters.length > 0 && <div className="active-filter-list" aria-label="Active filters">{activeFilters.map((key) => <button key={key} type="button" onClick={() => setParam(key, '')}>{key}: {params.get(key)} <X size={13} /></button>)}</div>}
          {!loading && !error && shownProducts.length > 0 && <div className="product-grid">{shownProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
          {!loading && !error && activeProducts.length > 0 && !shownProducts.length && <div className="catalog-empty"><span><SlidersHorizontal size={22} /></span><h3>No products match these filters</h3><p>Try changing the search or clearing one or more filters.</p><button type="button" className="button button-primary" onClick={clearRefinements}>Clear filters <ArrowRight size={16} /></button></div>}
          {mode === 'demo' && <p className="demo-data-note">Demo edits stay in this browser and are not shared across devices. Product information and availability are examples, not verified store data.</p>}
        </section>
      </div>
    </main>
  )
}
