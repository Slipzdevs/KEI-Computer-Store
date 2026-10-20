import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { Archive, ArrowLeft, Check, CircleAlert, ExternalLink, ImagePlus, LogOut, PackagePlus, Plus, Save, ShieldCheck, Trash2, Upload, X } from 'lucide-react'
import { useAdminAuth } from '../../state/AdminAuthContext'
import { useCatalog } from '../../state/CatalogContext'
import { catalogService, getCatalogMode, validateProductForPublish } from '../../services/catalog'
import { store } from '../../config/store'
import type { AvailabilityStatus, Category, Product, ProductCondition, ProductDraft, PublicationStatus, ProductImage, ProductSpecification } from '../../types/product'
import { formatMoney } from '../../utils/money'

const conditionLabels: Record<ProductCondition, string> = { new_sealed: 'New, sealed', new_open_box: 'New, open-box', used: 'Second-hand / used', refurbished: 'Refurbished' }
const availabilityLabels: Record<AvailabilityStatus, string> = { in_stock: 'In stock', out_of_stock: 'Out of stock', check_at_store: 'Check at store' }

function SetupMessage({ title = 'Admin setup required' }: { title?: string }) {
  return <main className="admin-setup page-wrap"><span className="admin-setup-icon"><ShieldCheck size={24} /></span><p className="eyebrow">Private product management</p><h1>{title}</h1><p>Secure sign-in is available only in Supabase mode. Configure your Supabase project, apply the reviewed migrations, and invite the store administrator as described in the README.</p><p>Demo mode does not simulate administrator authentication or provide secure access control.</p><Link className="button button-secondary" to="/">Return to the product showcase</Link></main>
}

function UnauthorizedMessage() {
  const auth = useAdminAuth()
  return <main className="admin-setup page-wrap"><span className="admin-setup-icon"><CircleAlert size={24} /></span><p className="eyebrow">Private product management</p><h1>Administrator access required</h1><p>{auth.error || 'This signed-in account is not listed as a store administrator. Contact the project owner to provision access in Supabase.'}</p><button className="button button-secondary" type="button" onClick={() => void auth.signOut()}>Sign out</button></main>
}

function AdminLayout() {
  const auth = useAdminAuth()
  if (auth.mode === 'demo') return <AdminShell email="Demo mode · not secure" demo />
  if (!auth.configured) return <SetupMessage />
  if (auth.loading) return <main className="admin-state" role="status">Checking administrator access…</main>
  if (!auth.user) return <Navigate to="/admin/login" replace />
  if (!auth.isAdmin) return <UnauthorizedMessage />
  return <AdminShell email={auth.user.email ?? 'Administrator'} onSignOut={() => void auth.signOut()} />
}

function AdminShell({ email, demo = false, onSignOut }: { email: string; demo?: boolean; onSignOut?: () => void }) {
  return <div className="admin-shell"><aside className="admin-sidebar"><Link className="admin-brand" to="/admin"><span>{store.monogram}</span>{store.name}<small>{demo ? 'DEMO · NOT PRIVATE' : 'PRIVATE CATALOG'}</small></Link><nav aria-label="Administration"><Link to="/admin">Overview</Link><Link to="/admin/products">Products</Link><Link to="/admin/categories">Categories</Link></nav>{onSignOut && <button className="admin-signout" type="button" onClick={onSignOut}><LogOut size={16} /> Sign out</button>}</aside><div className="admin-main"><header className="admin-topbar"><div><span>{demo ? 'DEMO DATA · LOCAL TO THIS BROWSER' : 'Catalog management'}</span><strong>{email}</strong></div></header><main className="admin-content"><Outlet /></main></div></div>
}

export function AdminLoginPage() {
  const auth = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  if (auth.mode !== 'supabase' || !auth.configured) return <SetupMessage title="Connect Supabase to sign in" />
  if (auth.user && auth.isAdmin) return <Navigate to="/admin" replace />
  async function submit(event: FormEvent) {
    event.preventDefault(); setFormError('')
    if (!email.trim() || !password) { setFormError('Enter your administrator email and password.'); return }
    setSubmitting(true)
    try {
      const isAdmin = await auth.signIn(email.trim(), password)
      if (isAdmin) navigate('/admin', { replace: true })
    } catch {
      setFormError('Sign-in failed. Check your details and try again.')
    } finally {
      setSubmitting(false)
    }
  }
  return <main className="admin-login-page"><form className="admin-login-card" onSubmit={submit}><Link to="/" className="admin-login-brand">{store.name}</Link><p className="eyebrow">Private administrator access</p><h1>Sign in</h1><p>Use the account invited by the store administrator.</p>{auth.loading && <p role="status">Checking your existing session…</p>}{(formError || auth.error) && <p className="admin-alert" role="alert">{formError || auth.error}</p>}<label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in securely'}</button><Link to="/" className="admin-back-link">Back to the public site</Link><small>Administrator accounts are provisioned through the Supabase Dashboard. There is no public sign-up.</small></form></main>
}

export function AdminRoutes() {
  return <Routes><Route path="login" element={<AdminLoginPage />} /><Route element={<AdminLayout />}><Route index element={<AdminOverview />} /><Route path="products" element={<AdminProductsPage />} /><Route path="products/new" element={<AdminProductFormPage />} /><Route path="products/:id/edit" element={<AdminProductFormPage />} /><Route path="categories" element={<AdminCategoriesPage />} /><Route path="*" element={<AdminNotFound />} /></Route></Routes>
}

function DemoWarning() {
  return getCatalogMode() === 'demo' ? <div className="admin-demo-warning" role="note"><strong>Demo management only.</strong> Changes stay in this browser. This page is not protected and is not shared across devices. Do not enter real store data.</div> : null
}

function AdminOverview() {
  const { mode } = useCatalog()
  const [counts, setCounts] = useState({ published: 0, drafts: 0, archived: 0 })
  useEffect(() => { void catalogService.listAdminProducts().then((items) => setCounts({ published: items.filter((item) => item.publicationStatus === 'published').length, drafts: items.filter((item) => item.publicationStatus === 'draft').length, archived: items.filter((item) => item.publicationStatus === 'archived').length })).catch(() => setCounts({ published: 0, drafts: 0, archived: 0 })) }, [])
  return <><DemoWarning /><header className="admin-page-heading"><p className="eyebrow">Catalog overview · {mode === 'demo' ? 'DEMO' : 'PRIVATE'}</p><h1>Product management</h1><p>Maintain the products customers can review and ask about at the physical store.</p></header><div className="admin-metric-grid"><article><span>Published</span><strong>{counts.published}</strong></article><article><span>Drafts</span><strong>{counts.drafts}</strong></article><article><span>Archived</span><strong>{counts.archived}</strong></article></div><section className="admin-panel"><h2>Next actions</h2><p>Review draft information, confirm condition and availability, add product images, then publish approved listings.</p><div className="admin-action-row"><Link className="button button-primary" to="/admin/products/new"><PackagePlus size={16} /> Add product</Link><Link className="button button-secondary" to="/admin/products">Manage products</Link></div></section></>
}

function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [conditionFilter, setConditionFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { const [products, categoryRows] = await Promise.all([catalogService.listAdminProducts(), catalogService.listCategories(true)]); setItems(products); setCategories(categoryRows) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Products could not be loaded.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => items.filter((product) => {
    const text = [product.name, product.sku, product.brand, product.model].join(' ').toLowerCase()
    return (!query || text.includes(query.toLowerCase())) && (!categoryFilter || product.categoryId === categoryFilter) && (!conditionFilter || product.condition === conditionFilter) && (!availabilityFilter || product.availabilityStatus === availabilityFilter) && (!statusFilter || product.publicationStatus === statusFilter)
  }), [items, query, categoryFilter, conditionFilter, availabilityFilter, statusFilter])
  async function publish(product: Product) {
    const problems = validateProductForPublish(productToDraft(product))
    if (problems.length) { setError(`Cannot publish ${product.name}: complete ${problems.join(', ')}.`); return }
    try { await catalogService.setPublicationStatus(product.id, 'published'); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not publish this product.') }
  }
  async function archive(product: Product) {
    if (!window.confirm(`Archive “${product.name}”? It will no longer appear in the public catalog.`)) return
    try { await catalogService.setPublicationStatus(product.id, 'archived'); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not archive this product.') }
  }
  async function remove(product: Product) {
    if (!window.confirm(`Permanently delete “${product.name}” and its images? This cannot be undone.`)) return
    try { await catalogService.deleteProduct(product.id); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete this product.') }
  }
  return <><DemoWarning /><header className="admin-page-heading admin-heading-actions"><div><p className="eyebrow">Catalog</p><h1>Products</h1><p>Search and maintain published products, drafts, and archived listings.</p></div><Link className="button button-primary" to="/admin/products/new"><Plus size={16} /> New product</Link></header>{error && <p className="admin-alert" role="alert">{error}</p>}
    <section className="admin-panel"><div className="admin-filter-grid"><label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, brand, model, SKU" /></label><label>Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Condition<select value={conditionFilter} onChange={(event) => setConditionFilter(event.target.value)}><option value="">All conditions</option>{Object.entries(conditionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Availability<select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}><option value="">All availability</option>{Object.entries(availabilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Publication<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label></div>
      {loading ? <p className="admin-state">Loading products…</p> : !filtered.length ? <div className="admin-empty"><h2>{items.length ? 'No products match these filters' : 'No products yet'}</h2><p>Add a product draft and fill in approved store information when it is available.</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Condition</th><th>Category</th><th>Price</th><th>Availability</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id}><td><span className="admin-product-cell">{product.imageUrl && <img src={product.imageUrl} alt="" />}<span><strong>{product.name || 'Untitled draft'}</strong><small>{product.brand} {product.model} · {product.sku}</small></span></span></td><td>{product.condition ? conditionLabels[product.condition] : 'Not set'}</td><td>{categories.find((category) => category.id === product.categoryId)?.name ?? 'Not set'}</td><td>{product.price == null ? 'Not set' : formatMoney(product.price, product.currency)}</td><td>{product.availabilityStatus ? availabilityLabels[product.availabilityStatus] : 'Not set'}</td><td><span className={`admin-status status-${product.publicationStatus}`}>{product.publicationStatus}</span></td><td>{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : '—'}</td><td><div className="admin-row-actions"><Link to={`/admin/products/${product.id}/edit`} aria-label={`Edit ${product.name || 'draft'}`}>Edit</Link>{product.publicationStatus !== 'published' && <button type="button" onClick={() => void publish(product)}>Publish</button>}{product.publicationStatus !== 'archived' && <button type="button" onClick={() => void archive(product)}>Archive</button>}<button type="button" className="danger" onClick={() => void remove(product)}>Delete</button></div></td></tr>)}</tbody></table></div>}
    </section></>
}

function emptyDraft(): ProductDraft { return { name: '', slug: '', sku: '', brand: '', model: '', categoryId: null, condition: null, description: '', price: null, currency: store.currency, availabilityStatus: null, specifications: [{ label: '', value: '' }], includedAccessories: [], warrantyDetails: '', conditionNotes: '', knownDefects: '', publicationStatus: 'draft', isFeatured: false } }
function productToDraft(product: Product): ProductDraft { return { name: product.name, slug: product.slug, sku: product.sku, brand: product.brand, model: product.model, categoryId: product.categoryId, condition: product.condition, description: product.description, price: product.price, currency: product.currency, availabilityStatus: product.availabilityStatus, specifications: product.technicalSpecifications, includedAccessories: product.includedAccessories, warrantyDetails: product.warrantyDetails, conditionNotes: product.conditionNotes, knownDefects: product.knownDefects, publicationStatus: product.publicationStatus, isFeatured: product.isFeatured } }

function AdminProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { refresh: refreshPublic } = useCatalog()
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft)
  const [categories, setCategories] = useState<Category[]>([])
  const [productId, setProductId] = useState(id ?? '')
  const [savedProduct, setSavedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const loadProduct = useCallback(async () => {
    if (!id) { setDraft(emptyDraft()); setSavedProduct(null); setLoading(false); return }
    setLoading(true); setError('')
    try { const product = await catalogService.getAdminProduct(id); if (!product) { setError('This product could not be found.'); return }; setSavedProduct(product); setDraft(productToDraft(product)); setProductId(id); setDirty(false) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Product could not be loaded.') }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { void loadProduct(); void catalogService.listCategories(true).then(setCategories).catch((cause) => setError(cause instanceof Error ? cause.message : 'Categories could not be loaded.')) }, [loadProduct])
  useEffect(() => { if (!dirty) return; const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }; window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler) }, [dirty])

  function update<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) { setDraft((current) => ({ ...current, [key]: value })); setDirty(true); setSuccess(''); setError('') }
  function updateSpec(index: number, key: keyof ProductSpecification, value: string) { setDraft((current) => ({ ...current, specifications: current.specifications.map((spec, i) => i === index ? { ...spec, [key]: value } : spec) })); setDirty(true) }
  function slugFromName(value: string) { update('name', value); if (!draft.slug || draft.slug === slugify(draft.name)) update('slug', slugify(value)) }
  async function save(status: PublicationStatus) {
    const next = { ...draft, publicationStatus: status }
    if (status === 'published') { const issues = validateProductForPublish(next); setValidationErrors(issues); if (issues.length) { setError(`Complete the required fields before publishing: ${issues.join(', ')}.`); return } }
    setSaving(true); setError(''); setSuccess(''); setValidationErrors([])
    try { const saved = await catalogService.saveProduct(next, productId || undefined); setSavedProduct(saved); setProductId(saved.id); setDraft(productToDraft(saved)); setDirty(false); setSuccess(status === 'published' ? 'Product published. Visitors can now see this approved listing.' : 'Draft saved in the selected catalog source.'); await refreshPublic(); if (!id) navigate(`/admin/products/${saved.id}/edit`, { replace: true }) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Product could not be saved. Your form entries are still here.') }
    finally { setSaving(false) }
  }
  async function changeStatus(status: PublicationStatus) {
    if (!productId) return
    if (status === 'archived' && !window.confirm('Archive this product? It will disappear from the public catalog.')) return
    setSaving(true); setError('')
    try { await catalogService.setPublicationStatus(productId, status); const next = await catalogService.getAdminProduct(productId); if (next) { setSavedProduct(next); setDraft(productToDraft(next)) }; setSuccess(status === 'archived' ? 'Product archived.' : status === 'draft' ? 'Product unpublished and saved as a draft.' : 'Product published.'); await refreshPublic() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Publication status could not be changed.') }
    finally { setSaving(false) }
  }
  async function deleteProduct() {
    if (!productId || !window.confirm(`Permanently delete “${draft.name || 'this draft'}” and its images? This cannot be undone.`)) return
    setSaving(true)
    try { await catalogService.deleteProduct(productId); await refreshPublic(); navigate('/admin/products') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Product could not be deleted.') }
    finally { setSaving(false) }
  }

  if (loading) return <p className="admin-state">Loading product…</p>
  return <><DemoWarning /><div className="admin-form-top"><Link to="/admin/products"><ArrowLeft size={15} /> Products</Link>{savedProduct && <span className={`admin-status status-${savedProduct.publicationStatus}`}>{savedProduct.publicationStatus}</span>}</div><header className="admin-page-heading"><p className="eyebrow">{id ? 'Product details' : 'New listing'}</p><h1>{id ? draft.name || 'Edit product' : 'Create product'}</h1><p>Fill in confirmed product information. Unknown details can remain blank while the listing is a draft.</p></header>
    {error && <p className="admin-alert" role="alert">{error}</p>}{success && <p className="admin-success" role="status"><Check size={16} /> {success}</p>}{validationErrors.length > 0 && <div className="admin-alert" role="alert"><strong>Publication requirements</strong><ul>{validationErrors.map((item) => <li key={item}>{item}</li>)}</ul></div>}
    <form className="admin-product-form" onSubmit={(event) => { event.preventDefault(); void save(draft.publicationStatus === 'published' ? 'published' : 'draft') }}>
      <section className="admin-panel"><h2>Identity</h2><div className="admin-form-grid"><label className="span-two">Product name<input required={draft.publicationStatus === 'published'} value={draft.name} onChange={(event) => slugFromName(event.target.value)} /></label><label>Brand<input value={draft.brand} onChange={(event) => update('brand', event.target.value)} /></label><label>Model<input value={draft.model} onChange={(event) => update('model', event.target.value)} /></label><label>SKU<input value={draft.sku} onChange={(event) => update('sku', event.target.value)} /></label><label>URL slug<input value={draft.slug} onChange={(event) => update('slug', slugify(event.target.value))} /></label><label>Category<select value={draft.categoryId ?? ''} onChange={(event) => update('categoryId', event.target.value || null)}><option value="">Select a category</option>{categories.filter((category) => category.isActive || category.id === draft.categoryId).map((category) => <option key={category.id} value={category.id}>{category.name}{!category.isActive ? ' (inactive)' : ''}</option>)}</select></label></div></section>
      <section className="admin-panel"><h2>Condition and availability</h2><div className="admin-form-grid"><label>Condition<select value={draft.condition ?? ''} onChange={(event) => update('condition', (event.target.value || null) as ProductCondition | null)}><option value="">Select condition</option>{Object.entries(conditionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Availability<select value={draft.availabilityStatus ?? ''} onChange={(event) => update('availabilityStatus', (event.target.value || null) as AvailabilityStatus | null)}><option value="">Select availability</option>{Object.entries(availabilityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="span-two">Condition notes<textarea rows={3} value={draft.conditionNotes} onChange={(event) => update('conditionNotes', event.target.value)} placeholder="Describe wear, packaging, or refurbishment work when confirmed." /></label><label className="span-two">Known defects<textarea rows={3} value={draft.knownDefects} onChange={(event) => update('knownDefects', event.target.value)} /></label></div></section>
      <section className="admin-panel"><h2>Price</h2><div className="admin-form-grid"><label>Selling price<input type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="Leave blank for a draft" value={draft.price ?? ''} onChange={(event) => update('price', event.target.value === '' ? null : Number(event.target.value))} /></label><label>Currency<input maxLength={3} value={draft.currency} onChange={(event) => update('currency', event.target.value.toUpperCase())} /></label></div></section>
      <section className="admin-panel"><h2>Description and specifications</h2><label>Description<textarea rows={5} value={draft.description} onChange={(event) => update('description', event.target.value)} /></label><div className="admin-spec-heading"><div><h3>Technical specifications</h3><p>Add category-specific label and value pairs.</p></div><button type="button" className="button button-secondary" onClick={() => { update('specifications', [...draft.specifications, { label: '', value: '' }]) }}><Plus size={15} /> Add specification</button></div>{draft.specifications.map((spec, index) => <div className="admin-spec-row" key={index}><label>Specification name<input value={spec.label} onChange={(event) => updateSpec(index, 'label', event.target.value)} placeholder="e.g. Processor" /></label><label>Value<input value={spec.value} onChange={(event) => updateSpec(index, 'value', event.target.value)} placeholder="e.g. Intel Core i7" /></label><button className="admin-icon-button" type="button" aria-label="Remove specification" onClick={() => { update('specifications', draft.specifications.filter((_, i) => i !== index)) }}><X size={15} /></button></div>)}</section>
      <section className="admin-panel"><h2>Warranty and included items</h2><label>Warranty details<textarea rows={3} value={draft.warrantyDetails} onChange={(event) => update('warrantyDetails', event.target.value)} placeholder="Leave blank if warranty terms are not confirmed." /></label><label>Included accessories<textarea rows={3} value={draft.includedAccessories.join('\n')} onChange={(event) => update('includedAccessories', event.target.value.split('\n'))} placeholder="One item per line" /></label></section>
      <section className="admin-panel"><h2>Public listing</h2><label className="admin-checkbox"><input type="checkbox" checked={draft.isFeatured} onChange={(event) => update('isFeatured', event.target.checked)} /> Feature on homepage</label><p>Publishing makes this product visible on the public catalog. Required fields and approved price must be present.</p><div className="admin-form-actions"><button type="button" className="button button-secondary" disabled={saving} onClick={() => void save('draft')}><Save size={15} /> {saving ? 'Saving…' : 'Save draft'}</button><button type="button" className="button button-primary" disabled={saving} onClick={() => void save('published')}>{saving ? 'Saving…' : savedProduct?.publicationStatus === 'published' ? 'Save and publish' : 'Publish product'}</button>{savedProduct?.publicationStatus === 'published' && <button type="button" className="button button-secondary" disabled={saving} onClick={() => void changeStatus('draft')}>Unpublish</button>}{productId && savedProduct?.publicationStatus !== 'archived' && <button type="button" className="button button-secondary" disabled={saving} onClick={() => void changeStatus('archived')}><Archive size={15} /> Archive</button>}{productId && <button type="button" className="admin-danger-button" disabled={saving} onClick={() => void deleteProduct()}><Trash2 size={15} /> Delete</button>}</div></section>
    </form>
    {productId && <ProductImageManager product={savedProduct} onChanged={async () => { const latest = await catalogService.getAdminProduct(productId); if (latest) setSavedProduct(latest); await refreshPublic() }} />}
    <div className="admin-preview-link"><Link to={`/products/${draft.slug}`} target="_blank">Preview public product page <ExternalLink size={14} /></Link><span>Unsaved or draft products are not available to public visitors.</span></div>
  </>
}

function ProductImageManager({ product, onChanged }: { product: Product | null; onChanged: () => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function upload() {
    if (!product || !file) return
    if (!altText.trim()) { setMessage('Add descriptive alternative text before uploading.'); return }
    setBusy(true); setMessage('Uploading image…')
    try { await catalogService.uploadProductImage(product.id, file, altText); setFile(null); setAltText(''); await onChanged(); setMessage('Image uploaded.') }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Image upload failed.') }
    finally { setBusy(false) }
  }
  async function reorder(image: ProductImage, delta: number) {
    if (!product) return
    const images = product.images.slice().sort((a, b) => a.sortOrder - b.sortOrder)
    const index = images.findIndex((item) => item.id === image.id)
    const target = index + delta
    if (target < 0 || target >= images.length) return
    const first = images[index], second = images[target]
    setBusy(true)
    try { await catalogService.updateImage(first, { sortOrder: second.sortOrder }); await catalogService.updateImage(second, { sortOrder: first.sortOrder }); await onChanged() }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Image order could not be updated.') }
    finally { setBusy(false) }
  }
  async function saveAlt(image: ProductImage, value: string) {
    setBusy(true)
    try { await catalogService.updateImage(image, { altText: value }); await onChanged(); setMessage('Alternative text saved.') }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Alternative text could not be saved.') }
    finally { setBusy(false) }
  }
  async function removeImage(image: ProductImage) {
    if (!window.confirm('Remove this product image?')) return
    setBusy(true)
    try { await catalogService.deleteProductImage(image); await onChanged(); setMessage('Image removed.') }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Image could not be removed.') }
    finally { setBusy(false) }
  }
  return <section className="admin-panel admin-image-manager"><h2>Product images</h2><p>JPEG, PNG, WebP, or AVIF · up to 8 MB each. Images use private storage and signed display links in Supabase mode.</p>{!product ? <p>Save a draft before uploading images.</p> : <><div className="admin-image-upload"><label className="admin-file-field"><span><ImagePlus size={18} /> Choose image</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setAltText('') }} /></label>{file && <><span>{file.name}</span><label>Alternative text<input value={altText} onChange={(event) => setAltText(event.target.value)} /></label><button type="button" className="button button-primary" onClick={() => void upload()} disabled={busy}><Upload size={15} /> {busy ? 'Uploading…' : 'Upload image'}</button></>}</div><div className="admin-image-grid">{product.images.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((image, index) => <article key={image.id}><img src={image.publicUrl} alt={image.altText} /><label>Alternative text<input defaultValue={image.altText} onBlur={(event) => event.target.value !== image.altText && void saveAlt(image, event.target.value)} /></label><div className="admin-image-actions"><button type="button" disabled={busy || index === 0} onClick={() => void reorder(image, -1)}>Move up</button><button type="button" disabled={busy || index === product.images.length - 1} onClick={() => void reorder(image, 1)}>Move down</button><button type="button" className="danger" disabled={busy} onClick={() => void removeImage(image)}>Remove</button></div></article>)}</div></>}{message && <p className="admin-form-message" role="status">{message}</p>}</section>
}

function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => { try { setItems(await catalogService.listCategories(true)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Categories could not be loaded.') } }, [])
  useEffect(() => { void load() }, [load])
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setBusy(true); try { await catalogService.saveCategory({ name, slug: slugify(slug), description, isActive: true }); setName(''); setSlug(''); setDescription(''); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Category could not be saved.') } finally { setBusy(false) } }
  async function toggle(category: Category) { try { await catalogService.saveCategory({ name: category.name, slug: category.slug, description: category.description, isActive: !category.isActive }, category.id); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Category could not be updated.') } }
  return <><DemoWarning /><header className="admin-page-heading"><p className="eyebrow">Catalog structure</p><h1>Categories</h1><p>Categories make the product catalog easier to browse.</p></header>{error && <p className="admin-alert" role="alert">{error}</p>}<form className="admin-panel admin-category-form" onSubmit={submit}><h2>Add category</h2><div className="admin-form-grid"><label>Name<input required value={name} onChange={(event) => { setName(event.target.value); if (!slug) setSlug(slugify(event.target.value)) }} /></label><label>URL slug<input required value={slug} onChange={(event) => setSlug(slugify(event.target.value))} /></label><label className="span-two">Description<input value={description} onChange={(event) => setDescription(event.target.value)} /></label></div><button className="button button-primary" type="submit" disabled={busy}><Plus size={15} /> Save category</button></form><section className="admin-panel"><h2>Existing categories</h2><div className="admin-category-list">{items.map((category) => <article key={category.id}><div><strong>{category.name}</strong><small>/{category.slug}{category.description && ` · ${category.description}`}</small></div><span className={`admin-status ${category.isActive ? 'status-published' : 'status-archived'}`}>{category.isActive ? 'Active' : 'Inactive'}</span><button type="button" onClick={() => void toggle(category)}>{category.isActive ? 'Deactivate' : 'Activate'}</button></article>)}</div></section></>
}

function AdminNotFound() { return <section className="admin-empty"><h1>Management page not found</h1><Link to="/admin">Back to overview</Link></section> }
function slugify(value: string) { return value.normalize('NFKD').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
