import type { ProductDraft } from '../types/product'

interface PublicCatalogRow {
  publication_status?: unknown
  categories?: { is_active?: unknown } | { is_active?: unknown }[] | null
}

export function filterPublicCatalogRows<T extends PublicCatalogRow>(rows: T[]): T[] {
  return rows.filter((row) => {
    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories
    return row.publication_status === 'published' && category?.is_active === true
  })
}

export function filterPublicDemoProducts<T extends { publicationStatus: string; category: string }>(
  products: T[],
  activeCategorySlugs: Set<string>,
): T[] {
  return products.filter((product) => product.publicationStatus === 'published' && activeCategorySlugs.has(product.category))
}

export function normalizePublicSpecifications(value: unknown): { label: string; value: string }[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const { label, value: specificationValue } = item as Record<string, unknown>
    if (typeof label !== 'string' || typeof specificationValue !== 'string' || !label.trim() || !specificationValue.trim()) return []
    return [{ label: label.trim(), value: specificationValue.trim() }]
  })
}

export async function resolveSignedImageUrl(
  createSignedUrl: () => Promise<{ data: { signedUrl?: string } | null; error: unknown | null }>,
): Promise<string> {
  try {
    const { data, error } = await createSignedUrl()
    return error || typeof data?.signedUrl !== 'string' ? '' : data.signedUrl
  } catch {
    return ''
  }
}

export function imageDisplayState(src: string, failedSrc: string | null): 'image' | 'fallback' {
  return !src.trim() || failedSrc === src ? 'fallback' : 'image'
}

export function validateProductForPublish(product: ProductDraft): string[] {
  const missing: string[] = []
  if (!product.name.trim()) missing.push('product name')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug.trim())) missing.push('valid URL slug')
  if (!product.sku.trim()) missing.push('SKU')
  if (!product.brand.trim()) missing.push('brand')
  if (!product.model.trim()) missing.push('model')
  if (!product.categoryId) missing.push('category')
  if (!product.condition) missing.push('condition')
  if (!product.description.trim()) missing.push('description')
  if (product.price == null || !Number.isFinite(product.price) || product.price <= 0) missing.push('price greater than zero')
  if (!/^[A-Z]{3}$/.test(product.currency.trim().toUpperCase())) missing.push('three-letter currency')
  if (!product.availabilityStatus) missing.push('availability status')
  if (!normalizePublicSpecifications(product.specifications).length) missing.push('at least one complete specification')
  return missing
}
