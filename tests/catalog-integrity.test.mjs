import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  filterPublicCatalogRows,
  filterPublicDemoProducts,
  imageDisplayState,
  normalizePublicSpecifications,
  resolveSignedImageUrl,
  validateProductForPublish,
} from '../src/utils/catalogIntegrity.ts'
import {
  getSupabaseConfigurationMessage,
  isValidSupabaseProjectUrl,
  isValidSupabasePublishableKey,
  resolveCatalogMode,
} from '../src/utils/deploymentConfig.ts'

const emptyDraft = {
  name: '', slug: '', sku: '', brand: '', model: '', categoryId: null,
  condition: null, description: '', price: null, currency: 'USD',
  availabilityStatus: null, specifications: [{ label: '', value: '' }],
  includedAccessories: [], warrantyDetails: '', conditionNotes: '', knownDefects: '',
  publicationStatus: 'draft', isFeatured: false,
}

test('public catalog rows require both published status and an active joined category', () => {
  const rows = [
    { slug: 'visible', publication_status: 'published', categories: { is_active: true } },
    { slug: 'draft', publication_status: 'draft', categories: { is_active: true } },
    { slug: 'inactive-category', publication_status: 'published', categories: { is_active: false } },
    { slug: 'hidden-category', publication_status: 'published', categories: null },
  ]

  const publicRows = filterPublicCatalogRows(rows)
  assert.deepEqual(publicRows.map((row) => row.slug), ['visible'])
  assert.equal(publicRows.some((row) => row.slug === 'draft'), false, 'direct slug lookups backed by the public result set cannot resolve drafts')
})

test('demo catalog applies the same publication and active-category limits', () => {
  const rows = [
    { slug: 'visible', publicationStatus: 'published', category: 'laptops' },
    { slug: 'draft', publicationStatus: 'draft', category: 'laptops' },
    { slug: 'inactive', publicationStatus: 'published', category: 'archived-category' },
  ]
  assert.deepEqual(filterPublicDemoProducts(rows, new Set(['laptops'])).map((row) => row.slug), ['visible'])
})

test('blank and malformed specifications are omitted without inventing values', () => {
  assert.deepEqual(normalizePublicSpecifications([
    { label: ' CPU ', value: ' Ryzen 5 ' },
    { label: 'RAM', value: '  ' },
    { label: '', value: '1 TB SSD' },
    { label: 12, value: 'Fabricated' },
  ]), [{ label: 'CPU', value: 'Ryzen 5' }])
})

test('signed URL failures produce an empty image source instead of failing the catalog', async () => {
  assert.equal(await resolveSignedImageUrl(async () => ({ data: null, error: new Error('expired or unavailable') })), '')
  assert.equal(await resolveSignedImageUrl(async () => { throw new Error('request failed') }), '')
  assert.equal(await resolveSignedImageUrl(async () => ({ data: { signedUrl: 'https://example.invalid/signed' }, error: null })), 'https://example.invalid/signed')
})

test('image fallback handles absent and expired URLs and recovers when a new signed URL arrives', () => {
  assert.equal(imageDisplayState('', null), 'fallback')
  assert.equal(imageDisplayState('old-signed-url', 'old-signed-url'), 'fallback')
  assert.equal(imageDisplayState('new-signed-url', 'old-signed-url'), 'image')
})

test('incomplete drafts are allowed in storage but publication validation blocks them', () => {
  assert.ok(validateProductForPublish(emptyDraft).length > 0)
  const complete = {
    ...emptyDraft,
    name: 'Laptop', slug: 'laptop', sku: 'KEI-1', brand: 'Brand', model: 'Model',
    categoryId: 'laptops', condition: 'new_sealed', description: 'Confirmed description',
    price: 500, availabilityStatus: 'in_stock', specifications: [{ label: 'CPU', value: 'Ryzen 5' }],
  }
  assert.deepEqual(validateProductForPublish(complete), [])
})

test('migration keeps public catalog policies constrained by publication and active category', async () => {
  const sql = await readFile(new URL('../supabase/migrations/202610200001_catalog_foundation.sql', import.meta.url), 'utf8')
  assert.match(sql, /create policy "Public reads active categories"[^;]*using \(is_active\)/s)
  assert.match(sql, /create policy "Public reads published products"[^;]*publication_status = 'published'[^;]*category\.is_active/s)
  assert.match(sql, /create policy "Public reads images for published products"[^;]*product\.publication_status = 'published'[^;]*category\.is_active/s)
})

test('demo mode must be explicit; missing or invalid mode requests Supabase setup', () => {
  assert.equal(resolveCatalogMode('demo'), 'demo')
  assert.equal(resolveCatalogMode(undefined), 'supabase')
  assert.equal(resolveCatalogMode('supabsae'), 'supabase')
  assert.match(getSupabaseConfigurationMessage(undefined, '', ''), /VITE_CATALOG_MODE is missing or invalid/)
  assert.match(getSupabaseConfigurationMessage('supabsae', '', ''), /VITE_CATALOG_MODE is missing or invalid/)
  assert.equal(getSupabaseConfigurationMessage('demo', '', ''), '')
})

test('Supabase configuration rejects malformed URLs and key placeholders without exposing values', () => {
  const jwtForRole = (role) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`
  assert.equal(isValidSupabaseProjectUrl('not-a-url'), false)
  assert.equal(isValidSupabaseProjectUrl('https://project.supabase.co'), true)
  assert.equal(isValidSupabasePublishableKey('placeholder-key'), false)
  assert.equal(isValidSupabasePublishableKey('sb_publishable_test-placeholder'), true)
  assert.equal(isValidSupabasePublishableKey(jwtForRole('anon')), true)
  assert.equal(isValidSupabasePublishableKey(jwtForRole('service_role')), false)
  assert.match(getSupabaseConfigurationMessage('supabase', 'bad-url', 'placeholder-key'), /valid HTTP or HTTPS project URL/)
  assert.match(getSupabaseConfigurationMessage('supabase', 'https://project.supabase.co', ''), /PUBLISHABLE_KEY is missing/)
})
