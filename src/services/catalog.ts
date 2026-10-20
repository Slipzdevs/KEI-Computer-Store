import { categories as demoCategories } from '../data/homepage'
import { products as seedProducts } from '../data/products'
import { catalogMode, supabase, supabaseConfigurationMessage } from '../lib/supabase'
import type { Category, Product, ProductDraft, ProductImage, PublicationStatus } from '../types/product'
import { filterPublicCatalogRows, filterPublicDemoProducts, normalizePublicSpecifications, resolveSignedImageUrl } from '../utils/catalogIntegrity'

const PRODUCT_KEY = 'kei-catalog-demo-v2'
const CATEGORY_KEY = 'kei-categories-demo-v1'
const IMAGE_BUCKET = 'product-images'
const MAX_IMAGE_SIZE = 8 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export class CatalogServiceError extends Error {
  constructor(message: string, readonly code: 'configuration' | 'network' | 'validation' | 'permission' | 'not-found' | 'unknown' = 'unknown') {
    super(message)
    this.name = 'CatalogServiceError'
  }
}

export function getCatalogMode() { return catalogMode }

function requireSupabase() {
  if (catalogMode !== 'supabase') throw new CatalogServiceError('This operation is only available in Supabase mode.', 'configuration')
  if (!supabase) throw new CatalogServiceError(supabaseConfigurationMessage, 'configuration')
  return supabase
}

function throwIfError(error: { message: string; code?: string } | null) {
  if (!error) return
  const code = error.code === '42501' ? 'permission' : error.code === '23514' || error.code === '23505' ? 'validation' : 'network'
  throw new CatalogServiceError(error.message, code)
}

async function mapImage(row: Record<string, unknown>, client: NonNullable<typeof supabase>): Promise<ProductImage> {
  const storagePath = String(row.storage_path ?? '')
  const publicUrl = await resolveSignedImageUrl(() => client.storage.from(IMAGE_BUCKET).createSignedUrl(storagePath, 60 * 15))
  return {
    id: String(row.id ?? ''), productId: String(row.product_id ?? ''), storagePath,
    altText: String(row.alt_text ?? ''), sortOrder: Number(row.sort_order ?? 0),
    publicUrl,
  }
}

async function mapProduct(row: Record<string, unknown>, client: NonNullable<typeof supabase>): Promise<Product> {
  const category = row.categories as { id?: string; name?: string; slug?: string; is_active?: boolean } | null
  const images = (await Promise.all(((row.product_images as Record<string, unknown>[] | null) ?? []).map((image) => mapImage(image, client)))).sort((a, b) => a.sortOrder - b.sortOrder)
  const technicalSpecifications = normalizePublicSpecifications(row.specifications)
  return {
    id: String(row.id), slug: String(row.slug), name: String(row.name), sku: String(row.sku), brand: String(row.brand ?? ''),
    model: String(row.model ?? ''), category: String(category?.slug ?? ''), categoryId: String(row.category_id ?? '') || null,
    price: row.price == null ? null : Number(row.price), currency: String(row.currency ?? 'USD'), description: String(row.description ?? ''),
    images, imageUrl: images[0]?.publicUrl ?? '', imageAlt: images[0]?.altText ?? `${String(row.name)} product image`,
    condition: (row.condition as Product['condition']) ?? null, availabilityStatus: (row.availability_status as Product['availabilityStatus']) ?? null,
    publicationStatus: row.publication_status as PublicationStatus,
    specifications: technicalSpecifications.map((spec) => `${spec.label}: ${spec.value}`), technicalSpecifications,
    includedAccessories: (row.included_accessories as string[] | null) ?? [], warrantyDetails: String(row.warranty_details ?? ''),
    conditionNotes: String(row.condition_notes ?? ''), knownDefects: String(row.known_defects ?? ''),
    updatedAt: String(row.updated_at ?? '') || null, isFeatured: Boolean(row.is_featured), newest: false, popularity: 0, featuredIn: [],
  }
}

function localRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback }
  catch { return fallback }
}
function localWrite<T>(key: string, value: T) {
  try { window.localStorage.setItem(key, JSON.stringify(value)) }
  catch { throw new CatalogServiceError('Demo changes could not be saved in this browser. Storage may be full or unavailable.', 'unknown') }
}

const demoProducts = () => localRead<Product[]>(PRODUCT_KEY, seedProducts)
const demoCategoryRows = (): Category[] => localRead<Category[]>(CATEGORY_KEY, demoCategories.map((item) => ({ id: item.slug, slug: item.slug, name: item.title, description: item.description, isActive: true, updatedAt: null })))

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Image preview could not be created.'))
    reader.onerror = () => reject(new Error('Image preview could not be created.'))
    reader.readAsDataURL(file)
  })
}

export const catalogService = {
  async listPublicProducts(): Promise<Product[]> {
    if (catalogMode === 'demo') {
      const activeCategorySlugs = new Set(demoCategoryRows().filter((category) => category.isActive).map((category) => category.slug))
      return filterPublicDemoProducts(demoProducts(), activeCategorySlugs)
    }
    const client = requireSupabase()
    const { data, error } = await client.from('products').select('*, categories!products_category_id_fkey(id,name,slug,is_active), product_images(*)').eq('publication_status', 'published').order('name')
    throwIfError(error)
    const publicRows = filterPublicCatalogRows((data ?? []) as unknown as { publication_status?: unknown; categories?: { is_active?: unknown } | { is_active?: unknown }[] | null; [key: string]: unknown }[])
    return Promise.all(publicRows.map((row) => mapProduct(row, client)))
  },

  async listAdminProducts(): Promise<Product[]> {
    if (catalogMode === 'demo') return demoProducts().slice().sort((a, b) => a.name.localeCompare(b.name))
    const client = requireSupabase()
    const { data, error } = await client.from('products').select('*, categories!products_category_id_fkey(id,name,slug), product_images(*)').order('updated_at', { ascending: false })
    throwIfError(error)
    return Promise.all((data ?? []).map((row) => mapProduct(row as unknown as Record<string, unknown>, client)))
  },

  async getAdminProduct(id: string): Promise<Product | null> {
    if (catalogMode === 'demo') return demoProducts().find((product) => product.id === id) ?? null
    const client = requireSupabase()
    const { data, error } = await client.from('products').select('*, categories!products_category_id_fkey(id,name,slug), product_images(*)').eq('id', id).maybeSingle()
    throwIfError(error)
    return data ? await mapProduct(data as unknown as Record<string, unknown>, client) : null
  },

  async listCategories(includeInactive = false): Promise<Category[]> {
    if (catalogMode === 'demo') return demoCategoryRows().filter((category) => includeInactive || category.isActive)
    const client = requireSupabase()
    let query = client.from('categories').select('*').order('name')
    if (!includeInactive) query = query.eq('is_active', true)
    const { data, error } = await query
    throwIfError(error)
    return (data ?? []).map((row) => ({ id: row.id, slug: row.slug, name: row.name, description: row.description ?? '', isActive: row.is_active, updatedAt: row.updated_at }))
  },

  async saveProduct(input: ProductDraft, id?: string): Promise<Product> {
    const slug = input.slug.trim()
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new CatalogServiceError('Use lowercase letters, numbers, and single hyphens in the product slug.', 'validation')
    if (input.price != null && (!Number.isFinite(input.price) || input.price <= 0)) throw new CatalogServiceError('Price must be greater than zero when provided.', 'validation')
    if (!/^[A-Za-z]{3}$/.test(input.currency.trim())) throw new CatalogServiceError('Currency must be a three-letter ISO code.', 'validation')
    if (catalogMode === 'demo') {
      const rows = demoProducts()
      const existing = id ? rows.find((product) => product.id === id) : undefined
      if (id && !existing) throw new CatalogServiceError('Product not found.', 'not-found')
      const duplicate = rows.find((product) => product.id !== id && ((input.sku.trim() && product.sku.toLowerCase() === input.sku.trim().toLowerCase()) || (slug && product.slug.toLowerCase() === slug.toLowerCase())))
      if (duplicate) throw new CatalogServiceError('SKU and URL slug must be unique.', 'validation')
      const category = demoCategoryRows().find((item) => item.id === input.categoryId)
      const next: Product = {
        ...(existing ?? { id: `demo-${crypto.randomUUID()}`, images: [], imageUrl: '', imageAlt: '', specifications: [], technicalSpecifications: [], featuredIn: [] }),
        ...input, id: existing?.id ?? `demo-${crypto.randomUUID()}`, category: category?.slug ?? '', categoryId: input.categoryId,
        brandId: input.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'), imageUrl: existing?.images[0]?.publicUrl ?? existing?.imageUrl ?? '',
        imageAlt: existing?.images[0]?.altText ?? existing?.imageAlt ?? '', updatedAt: new Date().toISOString(),
        popularity: existing?.popularity ?? 0, newest: existing?.newest ?? false, featuredIn: existing?.featuredIn ?? [], isFeatured: input.isFeatured,
        technicalSpecifications: input.specifications, specifications: input.specifications.map((item) => `${item.label}: ${item.value}`),
      }
      localWrite(PRODUCT_KEY, existing ? rows.map((product) => product.id === id ? next : product) : [next, ...rows])
      return next
    }
    const client = requireSupabase()
    const { data: authData, error: authError } = await client.auth.getUser()
    throwIfError(authError)
    if (!authData.user) throw new CatalogServiceError('Your session has expired. Sign in again.', 'permission')
    const payload = {
      name: input.name.trim(), slug, sku: input.sku.trim(), brand: input.brand.trim(), model: input.model.trim(),
      category_id: input.categoryId, condition: input.condition, description: input.description.trim() || null,
      price: input.price, currency: input.currency.trim().toUpperCase(), availability_status: input.availabilityStatus,
      publication_status: input.publicationStatus, is_featured: input.isFeatured, specifications: input.specifications.filter((item) => item.label.trim() && item.value.trim()).map((item) => ({ label: item.label.trim(), value: item.value.trim() })),
      included_accessories: input.includedAccessories.map((item) => item.trim()).filter(Boolean), warranty_details: input.warrantyDetails.trim() || null,
      condition_notes: input.conditionNotes.trim() || null, known_defects: input.knownDefects.trim() || null, updated_by: authData.user.id,
      ...(id ? {} : { created_by: authData.user.id }),
    }
    let query = id ? client.from('products').update(payload).eq('id', id) : client.from('products').insert(payload)
    const { data, error } = await query.select('*, categories!products_category_id_fkey(id,name,slug), product_images(*)').single()
    throwIfError(error)
    return await mapProduct(data as unknown as Record<string, unknown>, client)
  },

  async setPublicationStatus(id: string, status: PublicationStatus): Promise<void> {
    if (catalogMode === 'demo') {
      const rows = demoProducts()
      const next = rows.map((product) => product.id === id ? { ...product, publicationStatus: status, updatedAt: new Date().toISOString() } : product)
      if (!next.some((product) => product.id === id)) throw new CatalogServiceError('Product not found.', 'not-found')
      localWrite(PRODUCT_KEY, next)
      return
    }
    const client = requireSupabase()
    const { error } = await client.from('products').update({ publication_status: status }).eq('id', id)
    throwIfError(error)
  },

  async deleteProduct(id: string): Promise<void> {
    if (catalogMode === 'demo') {
      const rows = demoProducts()
      if (!rows.some((product) => product.id === id)) throw new CatalogServiceError('Product not found.', 'not-found')
      localWrite(PRODUCT_KEY, rows.filter((product) => product.id !== id))
      return
    }
    const client = requireSupabase()
    const { data: images, error: imageError } = await client.from('product_images').select('storage_path').eq('product_id', id)
    throwIfError(imageError)
    const { error } = await client.from('products').delete().eq('id', id)
    throwIfError(error)
    const paths = (images ?? []).map((image) => image.storage_path)
    if (paths.length) {
      const { error: storageError } = await client.storage.from(IMAGE_BUCKET).remove(paths)
      if (storageError) throw new CatalogServiceError(`Product was deleted, but private image cleanup needs attention: ${storageError.message}`, 'unknown')
    }
  },

  async saveCategory(category: Pick<Category, 'name' | 'slug' | 'description' | 'isActive'>, id?: string): Promise<void> {
    if (catalogMode === 'demo') {
      const rows = demoCategoryRows()
      const categoryId = id ?? `demo-category-${crypto.randomUUID()}`
      localWrite(CATEGORY_KEY, id ? rows.map((item) => item.id === id ? { ...item, ...category, updatedAt: new Date().toISOString() } : item) : [...rows, { id: categoryId, ...category, updatedAt: new Date().toISOString() }])
      return
    }
    const client = requireSupabase()
    const payload = { name: category.name.trim(), slug: category.slug.trim(), description: category.description.trim() || null, is_active: category.isActive }
    const { error } = id ? await client.from('categories').update(payload).eq('id', id) : await client.from('categories').insert(payload)
    throwIfError(error)
  },

  async uploadProductImage(productId: string, file: File, altText: string): Promise<ProductImage> {
    validateImageFile(file)
    if (catalogMode === 'demo') {
      const products = demoProducts()
      const product = products.find((item) => item.id === productId)
      if (!product) throw new CatalogServiceError('Save the product before adding images.', 'validation')
      const publicUrl = await readFileAsDataUrl(file)
      const image: ProductImage = { id: `demo-image-${crypto.randomUUID()}`, productId, storagePath: file.name, altText: altText.trim(), sortOrder: product.images.length, publicUrl }
      const next = { ...product, images: [...product.images, image], imageUrl: product.imageUrl || publicUrl, imageAlt: product.imageAlt || image.altText }
      localWrite(PRODUCT_KEY, products.map((item) => item.id === productId ? next : item))
      return image
    }
    const client = requireSupabase()
    const extension = file.name.split('.').pop()?.toLowerCase() || 'img'
    const storagePath = `products/${productId}/${crypto.randomUUID()}.${extension}`
    const { data: order, error: orderError } = await client.from('product_images').select('sort_order').eq('product_id', productId).order('sort_order', { ascending: false }).limit(1).maybeSingle()
    throwIfError(orderError)
    const sortOrder = (order?.sort_order ?? -1) + 1
    const { error: uploadError } = await client.storage.from(IMAGE_BUCKET).upload(storagePath, file, { contentType: file.type, upsert: false })
    throwIfError(uploadError)
    const { data, error } = await client.from('product_images').insert({ product_id: productId, storage_path: storagePath, alt_text: altText.trim(), sort_order: sortOrder }).select('*').single()
    if (error) { await client.storage.from(IMAGE_BUCKET).remove([storagePath]); throwIfError(error) }
    return await mapImage(data as unknown as Record<string, unknown>, client)
  },

  async updateImage(image: ProductImage, updates: { altText?: string; sortOrder?: number }): Promise<void> {
    if (catalogMode === 'demo') {
      const products = demoProducts()
      localWrite(PRODUCT_KEY, products.map((product) => product.id !== image.productId ? product : { ...product, images: product.images.map((item) => item.id !== image.id ? item : { ...item, ...updates }).sort((a, b) => a.sortOrder - b.sortOrder), imageAlt: updates.altText ?? product.imageAlt }))
      return
    }
    const client = requireSupabase()
    const payload = { ...(updates.altText === undefined ? {} : { alt_text: updates.altText.trim() }), ...(updates.sortOrder === undefined ? {} : { sort_order: updates.sortOrder }) }
    const { error } = await client.from('product_images').update(payload).eq('id', image.id)
    throwIfError(error)
  },

  async deleteProductImage(image: ProductImage): Promise<void> {
    if (catalogMode === 'demo') {
      const products = demoProducts()
      localWrite(PRODUCT_KEY, products.map((product) => product.id !== image.productId ? product : { ...product, images: product.images.filter((item) => item.id !== image.id), imageUrl: product.images.find((item) => item.id !== image.id)?.publicUrl ?? '', imageAlt: product.images.find((item) => item.id !== image.id)?.altText ?? '' }))
      return
    }
    const client = requireSupabase()
    const { error } = await client.from('product_images').delete().eq('id', image.id)
    throwIfError(error)
    const { error: storageError } = await client.storage.from(IMAGE_BUCKET).remove([image.storagePath])
    throwIfError(storageError)
  },
}

export function validateImageFile(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new CatalogServiceError('Choose a JPEG, PNG, WebP, or AVIF image.', 'validation')
  if (file.size > MAX_IMAGE_SIZE) throw new CatalogServiceError('Images must be 8 MB or smaller.', 'validation')
  if (file.size === 0) throw new CatalogServiceError('This image file is empty.', 'validation')
}

export { validateProductForPublish } from '../utils/catalogIntegrity'
